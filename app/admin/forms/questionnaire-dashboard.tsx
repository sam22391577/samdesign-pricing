"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { useEffect, useMemo, useState } from "react";
import {
  createQuestion,
  parseQuestionnaireQuestions,
  questionnaireQuestionTypeLabels,
  questionnaireQuestionTypes,
  questionnaireStatusLabels,
  type QuestionnaireQuestion,
  type QuestionnaireQuestionType,
  type QuestionnaireStatus,
} from "../../questionnaire-types";

type QuestionnaireRecord = {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: QuestionnaireStatus;
  questions: QuestionnaireQuestion[];
  thankYouMessage: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  responseCount: number;
};

type ApiQuestionnaire = Omit<QuestionnaireRecord, "questions" | "responseCount"> & {
  questionsJson: string;
  responseCount: number | string;
};

type QuestionnaireResponseStatus = "new" | "reviewed" | "completed";

type QuestionnaireResponse = {
  id: string;
  questionnaireId: string;
  submittedAt: string;
  respondentName: string;
  respondentContact: string;
  answers: Record<string, string | string[]>;
  status: QuestionnaireResponseStatus;
  note: string;
};

type ApiQuestionnaireResponse = Omit<QuestionnaireResponse, "answers"> & { answersJson: string };
type Screen = "list" | "editor" | "responses";

const responseStatusLabels: Record<QuestionnaireResponseStatus, string> = {
  new: "未查看",
  reviewed: "處理中",
  completed: "已完成",
};

function safeAnswers(value: string) {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed as Record<string, string | string[]> : {};
  } catch {
    return {};
  }
}

function toQuestionnaire(row: ApiQuestionnaire): QuestionnaireRecord {
  return {
    ...row,
    questions: parseQuestionnaireQuestions(row.questionsJson),
    responseCount: Number(row.responseCount) || 0,
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function answerText(value: string | string[] | undefined) {
  return Array.isArray(value) ? value.join("、") : value || "未填寫";
}

export default function QuestionnaireDashboard({ displayName }: { displayName: string }) {
  const [questionnaires, setQuestionnaires] = useState<QuestionnaireRecord[]>([]);
  const [screen, setScreen] = useState<Screen>("list");
  const [editor, setEditor] = useState<QuestionnaireRecord | null>(null);
  const [responses, setResponses] = useState<QuestionnaireResponse[]>([]);
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | QuestionnaireStatus>("all");
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [newQuestionType, setNewQuestionType] = useState<QuestionnaireQuestionType>("short");
  const [deleteArmedId, setDeleteArmedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/forms", { headers: { accept: "application/json" } })
      .then(async (response) => {
        const payload = await response.json().catch(() => null) as { questionnaires?: ApiQuestionnaire[]; error?: string } | null;
        if (!response.ok) throw new Error(payload?.error || "無法讀取問卷");
        return payload;
      })
      .then((payload) => {
        if (!cancelled) setQuestionnaires((payload?.questionnaires ?? []).map(toQuestionnaire));
      })
      .catch((error) => { if (!cancelled) setLoadError(error instanceof Error ? error.message : "無法讀取問卷"); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!editor || !dirty || screen !== "editor") return;
    const timer = window.setTimeout(() => { void saveEditor(editor); }, 900);
    return () => window.clearTimeout(timer);
  }, [dirty, editor, screen]);

  const filteredQuestionnaires = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("zh-Hant");
    return questionnaires.filter((questionnaire) => {
      const matchesStatus = statusFilter === "all" || questionnaire.status === statusFilter;
      const matchesSearch = !keyword || `${questionnaire.title} ${questionnaire.description}`.toLocaleLowerCase("zh-Hant").includes(keyword);
      return matchesStatus && matchesSearch;
    });
  }, [questionnaires, search, statusFilter]);

  const selectedResponse = responses.find((response) => response.id === selectedResponseId) ?? null;
  const publishedCount = questionnaires.filter((item) => item.status === "published").length;
  const draftCount = questionnaires.filter((item) => item.status === "draft").length;
  const totalResponses = questionnaires.reduce((sum, item) => sum + item.responseCount, 0);

  function patchEditor(update: Partial<QuestionnaireRecord>) {
    setEditor((current) => current ? { ...current, ...update } : current);
    setSaveState("saving");
    setDirty(true);
  }

  function patchQuestion(questionId: string, update: Partial<QuestionnaireQuestion>) {
    if (!editor) return;
    patchEditor({ questions: editor.questions.map((question) => question.id === questionId ? { ...question, ...update } : question) });
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    if (!editor) return;
    const target = index + direction;
    if (target < 0 || target >= editor.questions.length) return;
    const questions = [...editor.questions];
    [questions[index], questions[target]] = [questions[target], questions[index]];
    patchEditor({ questions });
  }

  function duplicateQuestion(question: QuestionnaireQuestion) {
    if (!editor) return;
    const index = editor.questions.findIndex((item) => item.id === question.id);
    const questions = [...editor.questions];
    questions.splice(index + 1, 0, { ...question, id: crypto.randomUUID(), label: `${question.label}（複製）` });
    patchEditor({ questions });
  }

  async function saveEditor(snapshot: QuestionnaireRecord) {
    setSaveState("saving");
    try {
      const response = await fetch(`/api/admin/forms/${encodeURIComponent(snapshot.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          title: snapshot.title,
          description: snapshot.description,
          questions: snapshot.questions,
          thankYouMessage: snapshot.thankYouMessage,
        }),
      });
      const payload = await response.json().catch(() => null) as { error?: string; updatedAt?: string } | null;
      if (!response.ok) throw new Error(payload?.error || "儲存失敗");
      const updatedAt = payload?.updatedAt || new Date().toISOString();
      setEditor((current) => current?.id === snapshot.id ? { ...current, updatedAt } : current);
      setQuestionnaires((current) => current.map((item) => item.id === snapshot.id ? { ...snapshot, updatedAt } : item));
      setDirty(false);
      setSaveState("saved");
      return true;
    } catch (error) {
      setSaveState("error");
      setLoadError(error instanceof Error ? error.message : "儲存失敗");
      return false;
    }
  }

  async function createQuestionnaire() {
    if (busy) return;
    setBusy(true);
    setLoadError("");
    try {
      const response = await fetch("/api/admin/forms", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ title: "未命名問卷", description: "請填寫以下問題，讓我們更快了解您的需求。" }),
      });
      const payload = await response.json().catch(() => null) as { questionnaire?: ApiQuestionnaire; error?: string } | null;
      if (!response.ok || !payload?.questionnaire) throw new Error(payload?.error || "建立問卷失敗");
      const questionnaire = toQuestionnaire(payload.questionnaire);
      setQuestionnaires((current) => [questionnaire, ...current]);
      setEditor(questionnaire);
      setScreen("editor");
      setDirty(false);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "建立問卷失敗");
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(questionnaire: QuestionnaireRecord, status: QuestionnaireStatus) {
    const snapshot = editor?.id === questionnaire.id ? editor : questionnaire;
    if (editor?.id === questionnaire.id && dirty && !(await saveEditor(snapshot))) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/forms/${encodeURIComponent(questionnaire.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json().catch(() => null) as { error?: string; updatedAt?: string } | null;
      if (!response.ok) throw new Error(payload?.error || "更新狀態失敗");
      const next = { ...snapshot, status, updatedAt: payload?.updatedAt || new Date().toISOString(), publishedAt: status === "published" ? snapshot.publishedAt || new Date().toISOString() : snapshot.publishedAt };
      setQuestionnaires((current) => current.map((item) => item.id === next.id ? next : item));
      setEditor((current) => current?.id === next.id ? next : current);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "更新狀態失敗");
    } finally {
      setBusy(false);
    }
  }

  async function deleteQuestionnaire(questionnaire: QuestionnaireRecord) {
    if (deleteArmedId !== questionnaire.id) {
      setDeleteArmedId(questionnaire.id);
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/forms/${encodeURIComponent(questionnaire.id)}`, { method: "DELETE", headers: { accept: "application/json" } });
      if (!response.ok) throw new Error("刪除問卷失敗");
      setQuestionnaires((current) => current.filter((item) => item.id !== questionnaire.id));
      setDeleteArmedId(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "刪除問卷失敗");
    } finally {
      setBusy(false);
    }
  }

  async function openResponses(questionnaire: QuestionnaireRecord) {
    setEditor(questionnaire);
    setScreen("responses");
    setResponses([]);
    setSelectedResponseId(null);
    setLoadError("");
    try {
      const response = await fetch(`/api/admin/forms/${encodeURIComponent(questionnaire.id)}/responses`, { headers: { accept: "application/json" } });
      const payload = await response.json().catch(() => null) as { responses?: ApiQuestionnaireResponse[]; error?: string } | null;
      if (!response.ok) throw new Error(payload?.error || "讀取回覆失敗");
      setResponses((payload?.responses ?? []).map((item) => ({ ...item, answers: safeAnswers(item.answersJson) })));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "讀取回覆失敗");
    }
  }

  async function updateResponseStatus(responseId: string, status: QuestionnaireResponseStatus) {
    if (!editor) return;
    setResponses((current) => current.map((item) => item.id === responseId ? { ...item, status } : item));
    const response = await fetch(`/api/admin/forms/${encodeURIComponent(editor.id)}/responses/${encodeURIComponent(responseId)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) setLoadError("回覆狀態更新失敗，請重新整理後再試。");
  }

  async function copyPublicLink(questionnaire: QuestionnaireRecord) {
    const url = `${window.location.origin}/forms/${questionnaire.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setLoadError("已複製問卷網址。");
    } catch {
      setLoadError(`問卷網址：${url}`);
    }
  }

  function exportResponses() {
    if (!editor) return;
    const rows = [
      ["回覆編號", "送出時間", "姓名", "聯絡方式", "狀態", ...editor.questions.map((question) => question.label)],
      ...responses.map((response) => [response.id, formatDate(response.submittedAt), response.respondentName, response.respondentContact, responseStatusLabels[response.status], ...editor.questions.map((question) => answerText(response.answers[question.id]))]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${editor.title}-回覆.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function openEditor(questionnaire: QuestionnaireRecord) {
    setEditor({ ...questionnaire, questions: questionnaire.questions.map((question) => ({ ...question, options: [...question.options] })) });
    setDirty(false);
    setSaveState("saved");
    setScreen("editor");
  }

  const saveLabel = saveState === "saving" ? "正在自動儲存…" : saveState === "error" ? "儲存失敗" : "已自動儲存";

  return (
    <main className="inquiry-app questionnaire-app">
      <aside className="inquiry-sidebar">
        <a className="admin-brand" href="/" aria-label="返回 Sam Design Studio 首頁"><span className="admin-brand-mark">S</span><span><strong>SAM</strong><small>STUDIO CONSOLE</small></span></a>
        <nav className="admin-nav" aria-label="後台導覽">
          <span className="nav-label">工作台</span>
          <a className="nav-item" href="/admin/inquiries"><span aria-hidden="true">▤</span> 客戶需求</a>
          <a className="nav-item is-active" href="/admin/forms"><span aria-hidden="true">☷</span> 問卷管理 <b>{publishedCount}</b></a>
          <span className="nav-label">前台</span>
          <a className="nav-item" href="/" target="_blank"><span aria-hidden="true">⌁</span> 報價試算</a>
        </nav>
        <div className="admin-profile"><span className="profile-avatar">S</span><span><strong>{displayName}</strong><small>網站管理員</small></span></div>
      </aside>

      <section className="inquiry-main questionnaire-main">
        {screen === "list" && (
          <>
            <header className="admin-header questionnaire-header">
              <div><p>問卷工作台</p><h1>問卷管理</h1><span className="admin-header-subtitle">建立問卷、發布連結並集中查看回覆。</span></div>
              <div className="header-actions"><button className="primary-admin-button" type="button" disabled={busy} onClick={createQuestionnaire}>＋ 建立問卷</button></div>
            </header>
            {loadError && <div className="admin-sync-note" role="status">{loadError}</div>}
            <section className="metric-grid questionnaire-metrics" aria-label="問卷摘要">
              <article className="metric-card"><span className="metric-icon">●</span><div><span>收集中</span><strong>{publishedCount}</strong><small><b>目前開放</b><i>可接收新回覆</i></small></div></article>
              <article className="metric-card"><span className="metric-icon">○</span><div><span>草稿</span><strong>{draftCount}</strong><small><b>尚未發布</b><i>可以繼續編輯</i></small></div></article>
              <article className="metric-card"><span className="metric-icon">✓</span><div><span>累積回覆</span><strong>{totalResponses}</strong><small><b>全部問卷</b><i>集中整理</i></small></div></article>
            </section>
            <section className="questionnaire-panel">
              <div className="questionnaire-toolbar">
                <label className="admin-search"><span aria-hidden="true">⌕</span><span className="sr-only">搜尋問卷</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜尋問卷名稱…" /></label>
                <div className="questionnaire-filter-tabs" role="tablist" aria-label="問卷狀態">
                  {(["all", "published", "draft", "closed"] as const).map((status) => <button key={status} type="button" className={statusFilter === status ? "is-active" : ""} onClick={() => setStatusFilter(status)}>{status === "all" ? "全部" : questionnaireStatusLabels[status]}</button>)}
                </div>
              </div>
              <div className="questionnaire-list">
                {filteredQuestionnaires.map((questionnaire) => (
                  <article className="questionnaire-row" key={questionnaire.id}>
                    <div className="questionnaire-title-cell"><span className={`questionnaire-status status-${questionnaire.status}`}>{questionnaireStatusLabels[questionnaire.status]}</span><div><h2>{questionnaire.title}</h2><p>{questionnaire.description || "尚未填寫說明"}</p></div></div>
                    <dl><div><dt>問題</dt><dd>{questionnaire.questions.length} 題</dd></div><div><dt>回覆</dt><dd>{questionnaire.responseCount} 份</dd></div><div><dt>最後更新</dt><dd>{formatDate(questionnaire.updatedAt)}</dd></div></dl>
                    <div className="questionnaire-actions">
                      <button type="button" onClick={() => openEditor(questionnaire)}>編輯</button>
                      <button type="button" onClick={() => void openResponses(questionnaire)}>查看回覆</button>
                      <button type="button" disabled={questionnaire.status !== "published"} onClick={() => void copyPublicLink(questionnaire)}>分享</button>
                      <button className={deleteArmedId === questionnaire.id ? "is-danger" : ""} type="button" disabled={busy} onClick={() => void deleteQuestionnaire(questionnaire)}>{deleteArmedId === questionnaire.id ? "再次確認刪除" : "刪除"}</button>
                    </div>
                  </article>
                ))}
                {filteredQuestionnaires.length === 0 && <div className="questionnaire-empty"><span>☷</span><h2>目前沒有符合的問卷</h2><p>建立第一份問卷，或清除搜尋與篩選條件。</p></div>}
              </div>
            </section>
          </>
        )}

        {screen === "editor" && editor && (
          <>
            <header className="editor-topbar">
              <button type="button" onClick={() => setScreen("list")}>返回問卷列表</button>
              <span className={`save-state is-${saveState}`}>{saveLabel}</span>
              <div>
                <button type="button" onClick={() => void openResponses(editor)}>查看回覆</button>
                {editor.status === "published" && <button type="button" onClick={() => void copyPublicLink(editor)}>複製網址</button>}
                <button className="publish-button" type="button" disabled={busy} onClick={() => void changeStatus(editor, editor.status === "published" ? "closed" : "published")}>{editor.status === "published" ? "結束收件" : "發布問卷"}</button>
              </div>
            </header>
            {loadError && <div className="admin-sync-note" role="status">{loadError}</div>}
            <div className="questionnaire-editor-layout">
              <section className="questionnaire-editor">
                <div className="editor-section editor-basics"><span className="editor-kicker">基本設定</span><label><span>問卷名稱</span><input value={editor.title} onChange={(event) => patchEditor({ title: event.target.value })} /></label><label><span>問卷說明</span><textarea rows={3} value={editor.description} onChange={(event) => patchEditor({ description: event.target.value })} placeholder="簡單告訴填寫者這份問卷的用途" /></label></div>
                <div className="editor-section">
                  <div className="editor-section-heading"><div><span className="editor-kicker">問題內容</span><h2>共 {editor.questions.length} 題</h2></div><div className="add-question-control"><select value={newQuestionType} onChange={(event) => setNewQuestionType(event.target.value as QuestionnaireQuestionType)}>{questionnaireQuestionTypes.map((type) => <option key={type} value={type}>{questionnaireQuestionTypeLabels[type]}</option>)}</select><button type="button" onClick={() => patchEditor({ questions: [...editor.questions, createQuestion(newQuestionType)] })}>＋ 新增問題</button></div></div>
                  <div className="question-editor-list">
                    {editor.questions.map((question, index) => (
                      <article className="question-editor-card" key={question.id}>
                        <div className="question-editor-number">{String(index + 1).padStart(2, "0")}</div>
                        <div className="question-editor-fields">
                          <div className="question-editor-line"><label><span>問題</span><input value={question.label} onChange={(event) => patchQuestion(question.id, { label: event.target.value })} /></label><label><span>回答方式</span><select value={question.type} onChange={(event) => { const type = event.target.value as QuestionnaireQuestionType; patchQuestion(question.id, { type, options: ["single", "multiple", "dropdown"].includes(type) ? question.options.length ? question.options : ["選項 1", "選項 2"] : [] }); }}>{questionnaireQuestionTypes.map((type) => <option key={type} value={type}>{questionnaireQuestionTypeLabels[type]}</option>)}</select></label></div>
                          <label><span>補充說明 <small>選填</small></span><input value={question.helpText} onChange={(event) => patchQuestion(question.id, { helpText: event.target.value })} placeholder="例如：可填寫預算或希望完成時間" /></label>
                          {["single", "multiple", "dropdown"].includes(question.type) && <label><span>選項 <small>每行一個</small></span><textarea rows={4} value={question.options.join("\n")} onChange={(event) => patchQuestion(question.id, { options: event.target.value.split("\n") })} /></label>}
                          <div className="question-editor-footer"><label className="required-toggle"><input type="checkbox" checked={question.required} onChange={(event) => patchQuestion(question.id, { required: event.target.checked })} /><span>設為必填</span></label><div><button type="button" disabled={index === 0} onClick={() => moveQuestion(index, -1)}>上移</button><button type="button" disabled={index === editor.questions.length - 1} onClick={() => moveQuestion(index, 1)}>下移</button><button type="button" onClick={() => duplicateQuestion(question)}>複製</button><button className="danger-text" type="button" disabled={editor.questions.length === 1} onClick={() => patchEditor({ questions: editor.questions.filter((item) => item.id !== question.id) })}>刪除</button></div></div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
                <div className="editor-section"><span className="editor-kicker">送出後訊息</span><label><span>感謝文字</span><textarea rows={3} value={editor.thankYouMessage} onChange={(event) => patchEditor({ thankYouMessage: event.target.value })} /></label></div>
              </section>

              <aside className="questionnaire-preview" aria-label="問卷預覽">
                <div className="preview-heading"><span>即時預覽</span><b>{questionnaireStatusLabels[editor.status]}</b></div>
                <div className="preview-sheet"><small>SA DESIGN・QUESTIONNAIRE</small><h2>{editor.title || "未命名問卷"}</h2><p>{editor.description || "尚未填寫問卷說明"}</p><div className="preview-contact"><span>您的姓名</span><span>聯絡方式</span></div>{editor.questions.map((question, index) => <div className="preview-question" key={question.id}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{question.label || "未命名問題"}{question.required && <b>必填</b>}</strong>{question.helpText && <small>{question.helpText}</small>}<i>{questionnaireQuestionTypeLabels[question.type]}</i></div></div>)}</div>
              </aside>
            </div>
          </>
        )}

        {screen === "responses" && editor && (
          <>
            <header className="editor-topbar response-topbar"><button type="button" onClick={() => setScreen("list")}>返回問卷列表</button><div className="response-title"><span>問卷回覆</span><h1>{editor.title}</h1></div><div><button type="button" onClick={() => openEditor(editor)}>編輯問卷</button><button className="publish-button" type="button" disabled={responses.length === 0} onClick={exportResponses}>下載 CSV</button></div></header>
            {loadError && <div className="admin-sync-note" role="status">{loadError}</div>}
            <section className="questionnaire-response-panel">
              <div className="response-list-heading"><div><h2>全部回覆</h2><span>{responses.length} 份</span></div><p>點選一筆回覆即可查看完整內容。</p></div>
              <div className="questionnaire-response-layout">
                <div className="questionnaire-response-list">
                  {responses.map((response) => <button key={response.id} type="button" className={selectedResponseId === response.id ? "is-active" : ""} onClick={() => setSelectedResponseId(response.id)}><span className={`response-state state-${response.status}`} /> <span><strong>{response.respondentName}</strong><small>{response.respondentContact}</small></span><span><b>{responseStatusLabels[response.status]}</b><small>{formatDate(response.submittedAt)}</small></span></button>)}
                  {responses.length === 0 && <div className="questionnaire-empty compact"><span>○</span><h2>尚未收到回覆</h2><p>發布並分享問卷後，回覆會出現在這裡。</p></div>}
                </div>
                <aside className="questionnaire-response-detail">
                  {selectedResponse ? <><header><div><span>回覆內容</span><h2>{selectedResponse.respondentName}</h2><p>{selectedResponse.respondentContact}・{formatDate(selectedResponse.submittedAt)}</p></div><select value={selectedResponse.status} onChange={(event) => void updateResponseStatus(selectedResponse.id, event.target.value as QuestionnaireResponseStatus)}>{(Object.keys(responseStatusLabels) as QuestionnaireResponseStatus[]).map((status) => <option key={status} value={status}>{responseStatusLabels[status]}</option>)}</select></header><dl>{editor.questions.map((question) => <div key={question.id}><dt>{question.label}</dt><dd>{answerText(selectedResponse.answers[question.id])}</dd></div>)}</dl></> : <div className="response-detail-placeholder"><span>☷</span><h2>選擇一筆回覆</h2><p>這裡會顯示填寫者的完整回答。</p></div>}
                </aside>
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  );
}

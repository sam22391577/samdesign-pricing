"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { compactInquirySummary } from "../compact-summary";
import { caseStageLabels, defaultWorkflowAction, editableCaseStages, followUpAfterDays, followUpPresets, getActionAfterResponse, getSuggestedFollowUpAt, getWorkflowAction, getWorkflowActionsForStage, normalizeCaseStage, type CaseStage } from "../workflow-options";

type InquiryStatus = CaseStage;
type ReplyStatus = "needs_reply" | "waiting_client" | "client_replied" | "scheduled" | "paused" | "completed";
type Priority = "high" | "normal" | "low";

type InquiryRecordData = {
  id: string;
  submittedAt: string;
  updatedAt: string;
  clientName: string;
  company: string;
  email: string;
  contact: string;
  projectType: string;
  servicesJson: string;
  estimateLow: number;
  estimateHigh: number;
  budget: number | null;
  summaryJson: string;
  answersJson: string;
  status: InquiryStatus;
  replyStatus: ReplyStatus;
  priority: Priority;
  assignee: string;
  lastContactAt: string | null;
  nextFollowUpAt: string | null;
  nextAction: string;
  note: string;
};

const statusLabels = caseStageLabels;

const replyStatusLabels: Record<ReplyStatus, string> = {
  needs_reply: "待我回覆",
  waiting_client: "等待客戶",
  client_replied: "客戶已回覆",
  scheduled: "已安排處理",
  paused: "暫緩",
  completed: "已完成",
};

const priorityLabels: Record<Priority, string> = {
  high: "優先",
  normal: "一般",
  low: "稍後處理",
};

function parseStringArray(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function parseReadableAnswers(value: string) {
  return parseStringArray(value).flatMap((item) => {
    const line = item.trim();
    if (!line || line.startsWith("【") || line === "想進一步確認正式報價與可安排檔期，謝謝！") return [];
    const divider = line.indexOf("：");
    if (divider < 0) return [{ label: "補充說明", value: line }];
    return [{
      label: line.slice(0, divider).trim(),
      value: line.slice(divider + 1).trim(),
    }];
  });
}

function toDateTimeLocalValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

function formatReadableFollowUp(value: string | null) {
  if (!value) return "尚未安排";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "尚未安排";
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export default function InquiryRecord({ inquiryId, displayName }: { inquiryId: string; displayName: string }) {
  const router = useRouter();
  const [inquiry, setInquiry] = useState<InquiryRecordData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [contactCopied, setContactCopied] = useState(false);
  const [selectedFollowUpPreset, setSelectedFollowUpPreset] = useState("current");
  const [selectedCaseStage, setSelectedCaseStage] = useState<CaseStage>("new");
  const [defaultFollowUpAt] = useState(() => new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000).toISOString());

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/inquiries/${encodeURIComponent(inquiryId)}`, { headers: { accept: "application/json" } })
      .then(async (response) => {
        const payload = await response.json() as { inquiry?: InquiryRecordData; error?: string };
        if (!response.ok || !payload.inquiry) throw new Error(payload.error || "無法讀取這筆需求。");
        return payload.inquiry;
      })
      .then((record) => {
        if (cancelled) return;
        const normalizedStatus = normalizeCaseStage(record.status, record.nextAction);
        const normalizedRecord = record.nextAction
          ? { ...record, status: normalizedStatus }
          : { ...record, status: normalizedStatus, nextAction: defaultWorkflowAction.value, replyStatus: defaultWorkflowAction.replyStatus };
        setInquiry(normalizedRecord);
        setSelectedCaseStage(getWorkflowAction(normalizedRecord.nextAction)?.availableIn ?? normalizedStatus);
      })
      .catch((error) => { if (!cancelled) setMessage(error instanceof Error ? error.message : "無法讀取這筆需求。"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [inquiryId]);

  const services = useMemo(() => inquiry ? parseStringArray(inquiry.servicesJson) : [], [inquiry]);
  const summary = useMemo(() => inquiry ? compactInquirySummary(parseStringArray(inquiry.summaryJson)) : [], [inquiry]);
  const fullAnswers = useMemo(() => inquiry ? parseReadableAnswers(inquiry.summaryJson) : [], [inquiry]);

  async function savePatch(patch: Partial<Pick<InquiryRecordData, "status" | "replyStatus" | "priority" | "assignee" | "lastContactAt" | "nextFollowUpAt" | "nextAction" | "note" | "estimateLow" | "estimateHigh" | "budget">>) {
    if (!inquiry) return;
    const previous = inquiry;
    setInquiry({ ...inquiry, ...patch });
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/inquiries/${encodeURIComponent(inquiry.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!response.ok) throw new Error("儲存失敗，請再試一次。");
      setMessage("變更已儲存");
    } catch (error) {
      setInquiry(previous);
      setMessage(error instanceof Error ? error.message : "儲存失敗，請再試一次。");
    } finally {
      setSaving(false);
    }
  }

  async function markResponded() {
    if (!inquiry) return;
    const responseAction = getActionAfterResponse(inquiry.nextAction);
    setSelectedFollowUpPreset(String(responseAction.followUpDays ?? "current"));
    setSelectedCaseStage(responseAction.availableIn);
    await savePatch({
      status: responseAction.caseStage,
      replyStatus: responseAction.replyStatus,
      lastContactAt: new Date().toISOString(),
      nextAction: responseAction.value,
      nextFollowUpAt: getSuggestedFollowUpAt(responseAction) || null,
    });
  }

  function selectWorkflowAction(value: string) {
    if (!inquiry) return;
    const action = getWorkflowAction(value);
    if (!action) return;
    setSelectedFollowUpPreset(String(action.followUpDays ?? "current"));
    setInquiry({ ...inquiry, nextAction: action.value, replyStatus: action.replyStatus, nextFollowUpAt: getSuggestedFollowUpAt(action) || null });
  }

  function selectCaseStage(stage: CaseStage) {
    if (!inquiry) return;
    const firstAction = getWorkflowActionsForStage(stage)[0];
    setSelectedCaseStage(stage);
    if (firstAction) selectWorkflowAction(firstAction.value);
  }

  function selectFollowUpPreset(days: number, value: string) {
    if (!inquiry) return;
    setSelectedFollowUpPreset(value);
    setInquiry({ ...inquiry, nextFollowUpAt: followUpAfterDays(days) });
  }

  async function saveWorkflow() {
    if (!inquiry) return;
    const workflowAction = getWorkflowAction(inquiry.nextAction) ?? defaultWorkflowAction;
    await savePatch({
      status: workflowAction.caseStage,
      replyStatus: inquiry.replyStatus,
      nextAction: inquiry.nextAction,
      nextFollowUpAt: workflowAction.followUpDays === null ? null : inquiry.nextFollowUpAt || getSuggestedFollowUpAt(workflowAction) || defaultFollowUpAt,
    });
  }

  async function savePricing() {
    if (!inquiry) return;
    const estimateLow = inquiry.estimateLow || inquiry.estimateHigh || 0;
    const estimateHigh = inquiry.estimateHigh || inquiry.estimateLow || 0;
    if (estimateHigh < estimateLow) {
      setMessage("網站初估最高金額不可低於最低金額。");
      return;
    }
    await savePatch({ estimateLow, estimateHigh, budget: inquiry.budget });
  }

  async function deleteInquiry() {
    if (!inquiry) return;
    setDeleting(true);
    setMessage("");
    try {
      const response = await fetch(`/api/inquiries/${encodeURIComponent(inquiry.id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("刪除失敗，請再試一次。");
      router.replace("/admin/inquiries");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "刪除失敗，請再試一次。");
      setDeleting(false);
    }
  }

  async function copyContact() {
    try {
      await navigator.clipboard.writeText(contactValue);
      setContactCopied(true);
      window.setTimeout(() => setContactCopied(false), 1800);
    } catch {
      setMessage("無法自動複製，請手動選取聯絡方式。");
    }
  }

  if (loading) {
    return <main className="record-state"><span className="admin-brand-mark">S</span><strong>正在讀取需求…</strong></main>;
  }

  if (!inquiry) {
    return <main className="record-state"><span className="admin-brand-mark">S</span><strong>{message || "找不到這筆需求"}</strong><a href="/admin/inquiries">返回全部需求</a></main>;
  }

  const submittedAt = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(inquiry.submittedAt));
  const contactValue = inquiry.contact || inquiry.email || "未填寫";

  return (
    <main className="inquiry-record-page">
      <header className="record-topbar">
        <a className="admin-brand" href="/admin/inquiries"><span className="admin-brand-mark">S</span><span><strong>SAM</strong><small>STUDIO CONSOLE</small></span></a>
        <a className="record-back" href="/admin/inquiries">返回全部需求</a>
      </header>

      <div className="record-container">
        <div className="record-heading">
          <div><span>{inquiry.id}・{submittedAt}</span><h1>{inquiry.clientName}</h1><p>{inquiry.company || "個人委託"}</p></div>
          <span className={`status-badge status-${inquiry.status}`}><i />{statusLabels[inquiry.status]}</span>
        </div>

        {message && <div className={`record-message${message === "變更已儲存" ? " is-success" : ""}`} role="status">{message}</div>}

        <div className="record-grid">
          <div className="record-content">
            <section className="record-card">
              <div className="record-card-heading"><div><span>01</span><h2>聯絡資料</h2></div><small>客戶填寫內容</small></div>
              <div className="contact-grid"><div><span>姓名</span><strong>{inquiry.clientName}</strong></div><div><span>品牌／公司</span><strong>{inquiry.company || "未填寫"}</strong></div><div><span>您的聯絡方式</span><button className={`record-contact-copy${contactCopied ? " is-copied" : ""}`} type="button" onClick={copyContact} title="點擊複製聯絡方式"><strong>{contactValue}</strong><small aria-live="polite">{contactCopied ? "已複製" : "點擊複製"}</small></button></div></div>
            </section>

            <section className="record-card">
              <div className="record-card-heading"><div><span>02</span><h2>需求摘要</h2></div><small>{inquiry.projectType}</small></div>
              <div className="record-services">{services.map((service) => <span key={service}>{service}</span>)}</div>
              <ul className="record-summary">{summary.map((item, index) => <li key={`${item}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p></li>)}</ul>
              <div className="record-estimate record-price-editor">
                <div className="record-price-field">
                  <span>網站初估</span>
                  <div className="record-price-range">
                    <label><small>最低</small><div className="record-money-input"><span>NT$</span><input aria-label="網站初估最低金額" type="number" inputMode="numeric" min="0" step="100" value={inquiry.estimateLow || ""} onChange={(event) => setInquiry({ ...inquiry, estimateLow: Math.max(0, Math.round(Number(event.target.value) || 0)) })} placeholder="尚未估價" /></div></label>
                    <label><small>最高</small><div className="record-money-input"><span>NT$</span><input aria-label="網站初估最高金額" type="number" inputMode="numeric" min="0" step="100" value={inquiry.estimateHigh || ""} onChange={(event) => setInquiry({ ...inquiry, estimateHigh: Math.max(0, Math.round(Number(event.target.value) || 0)) })} placeholder="尚未估價" /></div></label>
                  </div>
                </div>
                <label className="record-price-field">
                  <span>客戶預算</span>
                  <div className="record-money-input"><span>NT$</span><input aria-label="客戶預算金額" type="number" inputMode="numeric" min="0" step="100" value={inquiry.budget ?? ""} onChange={(event) => setInquiry({ ...inquiry, budget: event.target.value ? Math.max(0, Math.round(Number(event.target.value))) : null })} placeholder="尚未設定" /></div>
                </label>
                <button className="record-price-save" type="button" disabled={saving} onClick={() => { void savePricing(); }}>{saving ? "儲存中…" : "儲存金額"}</button>
              </div>
              <details className="full-answers">
                <summary>查看所有填寫內容</summary>
                {fullAnswers.length > 0 ? (
                  <dl className="full-answer-list">
                    {fullAnswers.map((item, index) => (
                      <div className="full-answer-row" key={`${item.label}-${index}`}>
                        <dt>{item.label}</dt>
                        <dd>{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : <p className="full-answer-empty">這筆需求沒有其他填寫內容。</p>}
              </details>
            </section>

            <section className="record-card">
              <div className="record-card-heading"><div><span>03</span><h2>聯絡與排程</h2></div><small>掌握下一步</small></div>
              {inquiry.nextAction && !getWorkflowAction(inquiry.nextAction) && <p className="legacy-workflow-action">原本事項：{inquiry.nextAction}</p>}
              <fieldset className="workflow-action-picker record-workflow-action-picker">
                <legend>下一步事項</legend>
                <label className="workflow-stage-picker">
                  <span>處理階段</span>
                  <select value={selectedCaseStage} onChange={(event) => selectCaseStage(event.target.value as CaseStage)}>
                    {editableCaseStages.map((stage) => <option key={stage} value={stage}>{statusLabels[stage]}</option>)}
                  </select>
                  <small>只顯示這個階段可用的下一步</small>
                </label>
                <div className="workflow-action-group">
                  <span className="workflow-action-group-title">{statusLabels[selectedCaseStage]}的下一步</span>
                  <div className="workflow-action-options">
                    {getWorkflowActionsForStage(selectedCaseStage).map((action) => (
                      <label className="workflow-action-option" htmlFor={`record-workflow-${inquiry.id}-${action.value}`} aria-label={action.label} key={action.value}>
                        <input id={`record-workflow-${inquiry.id}-${action.value}`} type="radio" name="recordNextAction" value={action.value} checked={inquiry.nextAction === action.value} onChange={() => selectWorkflowAction(action.value)} />
                        <span><strong>{action.label}</strong><small>{action.helper}</small></span>
                      </label>
                    ))}
                  </div>
                </div>
              </fieldset>
              <fieldset className="follow-up-preset-picker record-follow-up-picker">
                <legend>下次追蹤</legend>
                <div className="follow-up-preset-options">
                  <button className={selectedFollowUpPreset === "current" ? "is-selected" : ""} type="button" onClick={() => setSelectedFollowUpPreset("current")}><strong>目前安排</strong><small>{formatReadableFollowUp(inquiry.nextFollowUpAt || defaultFollowUpAt)}</small></button>
                  {followUpPresets.map((preset) => <button className={selectedFollowUpPreset === preset.value ? "is-selected" : ""} type="button" key={preset.value} onClick={() => selectFollowUpPreset(preset.days, preset.value)}><strong>{preset.label}</strong><small>快速設定</small></button>)}
                </div>
                <label className="custom-follow-up-date"><span>自訂追蹤時間</span><input type="datetime-local" value={toDateTimeLocalValue(inquiry.nextFollowUpAt || defaultFollowUpAt)} onChange={(event) => { setSelectedFollowUpPreset("custom"); setInquiry({ ...inquiry, nextFollowUpAt: event.target.value ? new Date(event.target.value).toISOString() : null }); }} /></label>
              </fieldset>
              <div className="workflow-selection-summary"><span>套用後狀態</span><strong>{replyStatusLabels[inquiry.replyStatus]}</strong></div>
              <div className="record-workflow-actions"><button type="button" disabled={saving} onClick={markResponded}>標記已回覆客戶</button><button type="button" disabled={saving} onClick={saveWorkflow}>{saving ? "儲存中…" : "套用安排"}</button></div>
            </section>

            <section className="record-card">
              <div className="record-card-heading"><div><span>04</span><h2>內部備註</h2></div><small>僅管理員可見</small></div>
              <textarea value={inquiry.note} onChange={(event) => setInquiry({ ...inquiry, note: event.target.value })} rows={6} placeholder="記錄聯絡進度、報價備註或下一步…" aria-label="內部備註" />
              <button className="record-save" type="button" disabled={saving} onClick={() => savePatch({ note: inquiry.note })}>{saving ? "儲存中…" : "儲存備註"}</button>
            </section>
          </div>

          <aside className="record-sidebar">
            <section className="record-card record-management">
              <div className="record-card-heading"><div><h2>管理設定</h2></div></div>
              <label><span>處理狀態</span><select value={inquiry.status} onChange={(event) => { const status = event.target.value as InquiryStatus; setSelectedCaseStage(status); void savePatch({ status }); }}>{editableCaseStages.map((value) => <option key={value} value={value}>{statusLabels[value]}</option>)}</select></label>
              <label><span>優先順序</span><select value={inquiry.priority} onChange={(event) => savePatch({ priority: event.target.value as Priority })}>{Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label><span>負責人</span><select value={inquiry.assignee} onChange={(event) => savePatch({ assignee: event.target.value })}><option>{displayName}</option><option>Sam</option><option>尚未指派</option></select></label>
            </section>

            <section className="record-card record-contact-actions">
              <h2>快速聯絡</h2>
              <button type="button" onClick={copyContact}>{contactCopied ? "聯絡方式已複製" : "複製聯絡方式"} <span>{contactCopied ? "✓" : "⌘"}</span></button>
            </section>

            <section className="record-card record-danger">
              <h2>刪除需求</h2>
              {!deleteConfirm ? (
                <><p>刪除後將無法復原，相關內容與備註也會一併移除。</p><button type="button" onClick={() => setDeleteConfirm(true)}>刪除這筆需求</button></>
              ) : (
                <div className="delete-confirmation" role="alert"><strong>確定要永久刪除？</strong><p>{inquiry.clientName} 的需求將無法復原。</p><div><button type="button" onClick={() => setDeleteConfirm(false)}>取消</button><button type="button" disabled={deleting} onClick={deleteInquiry}>{deleting ? "刪除中…" : "確認刪除"}</button></div></div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

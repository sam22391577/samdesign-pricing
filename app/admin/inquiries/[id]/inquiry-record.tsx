"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { compactInquirySummary } from "../compact-summary";

type InquiryStatus = "new" | "contacted" | "quoted" | "won" | "archived";
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

const statusLabels: Record<InquiryStatus, string> = {
  new: "待處理",
  contacted: "已聯絡",
  quoted: "已報價",
  won: "已成交",
  archived: "已封存",
};

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

const currency = new Intl.NumberFormat("zh-TW", { style: "currency", currency: "TWD", maximumFractionDigits: 0 });

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

export default function InquiryRecord({ inquiryId, displayName }: { inquiryId: string; displayName: string }) {
  const router = useRouter();
  const [inquiry, setInquiry] = useState<InquiryRecordData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [contactCopied, setContactCopied] = useState(false);
  const [defaultFollowUpAt] = useState(() => new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000).toISOString());

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/inquiries/${encodeURIComponent(inquiryId)}`, { headers: { accept: "application/json" } })
      .then(async (response) => {
        const payload = await response.json() as { inquiry?: InquiryRecordData; error?: string };
        if (!response.ok || !payload.inquiry) throw new Error(payload.error || "無法讀取這筆需求。");
        return payload.inquiry;
      })
      .then((record) => { if (!cancelled) setInquiry(record); })
      .catch((error) => { if (!cancelled) setMessage(error instanceof Error ? error.message : "無法讀取這筆需求。"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [inquiryId]);

  const services = useMemo(() => inquiry ? parseStringArray(inquiry.servicesJson) : [], [inquiry]);
  const summary = useMemo(() => inquiry ? compactInquirySummary(parseStringArray(inquiry.summaryJson)) : [], [inquiry]);
  const fullAnswers = useMemo(() => inquiry ? parseReadableAnswers(inquiry.summaryJson) : [], [inquiry]);

  async function savePatch(patch: Partial<Pick<InquiryRecordData, "status" | "replyStatus" | "priority" | "assignee" | "lastContactAt" | "nextFollowUpAt" | "nextAction" | "note">>) {
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
    await savePatch({ replyStatus: "waiting_client", lastContactAt: new Date().toISOString() });
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
              <div className="record-estimate"><div><span>網站初估</span><strong>{currency.format(inquiry.estimateLow)} ～ {currency.format(inquiry.estimateHigh)}</strong></div><div><span>客戶預算</span><strong>{inquiry.budget ? currency.format(inquiry.budget) : "未設定"}</strong></div></div>
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
              <div className="record-workflow-grid">
                <label><span>回覆狀況</span><select value={inquiry.replyStatus} onChange={(event) => savePatch({ replyStatus: event.target.value as ReplyStatus })}>{Object.entries(replyStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label><span>下次追蹤時間</span><input type="datetime-local" value={toDateTimeLocalValue(inquiry.nextFollowUpAt || defaultFollowUpAt)} onChange={(event) => savePatch({ nextFollowUpAt: event.target.value ? new Date(event.target.value).toISOString() : null })} /></label>
                <label className="record-next-action"><span>下一步事項</span><input value={inquiry.nextAction} maxLength={180} onChange={(event) => setInquiry({ ...inquiry, nextAction: event.target.value })} placeholder="例如：確認需求、寄送報價、安排交稿" /></label>
              </div>
              <div className="record-workflow-actions"><button type="button" disabled={saving} onClick={markResponded}>標記已回覆客戶</button><button type="button" disabled={saving} onClick={() => savePatch({ nextAction: inquiry.nextAction })}>儲存下一步</button></div>
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
              <label><span>處理狀態</span><select value={inquiry.status} onChange={(event) => savePatch({ status: event.target.value as InquiryStatus })}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
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

"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { useEffect, useMemo, useRef, useState } from "react";
import { compactInquirySummary } from "./compact-summary";

type InquiryStatus = "new" | "contacted" | "quoted" | "won" | "archived";
type Priority = "high" | "normal" | "low";
type StatusView = "todo" | "active" | "done" | "all";
type DateFilter = "all" | "today" | "week" | "month";

type Inquiry = {
  id: string;
  client: string;
  company: string;
  email: string;
  contact: string;
  projectType: string;
  services: string[];
  estimate: string;
  budget: string;
  submittedAt: string;
  submittedTime: number;
  relativeTime: string;
  status: InquiryStatus;
  priority: Priority;
  assignee: string;
  summary: string[];
  note: string;
  persisted?: boolean;
};

type ApiInquiry = {
  id: string;
  submittedAt: string;
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
  status: InquiryStatus;
  priority: Priority;
  assignee: string;
  note: string;
};

// Preview mode intentionally starts empty. Inquiry examples previously used realistic
// contact details, which should not be published in a public source repository.
const sampleInquiries: Inquiry[] = [];

const statusLabels: Record<InquiryStatus, string> = {
  new: "待處理",
  contacted: "已聯絡",
  quoted: "已報價",
  won: "已成交",
  archived: "已封存",
};

const priorityLabels: Record<Priority, string> = {
  high: "優先",
  normal: "一般",
  low: "稍後處理",
};

const filters: Array<{ key: StatusView; label: string }> = [
  { key: "todo", label: "待處理" },
  { key: "active", label: "處理中" },
  { key: "done", label: "已完成" },
  { key: "all", label: "全部" },
];

const dateFilterLabels: Record<DateFilter, string> = {
  all: "不限時間",
  today: "今天收到",
  week: "最近 7 天",
  month: "最近 30 天",
};

const editableStatuses: InquiryStatus[] = ["new", "contacted", "quoted", "won", "archived"];

const currency = new Intl.NumberFormat("zh-TW", { style: "currency", currency: "TWD", maximumFractionDigits: 0 });

function safeStringArray(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function toInquiry(row: ApiInquiry): Inquiry {
  const submittedDate = new Date(row.submittedAt);
  const dateTime = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(submittedDate);
  const ageMinutes = Math.max(0, Math.round((Date.now() - submittedDate.getTime()) / 60_000));
  const relativeTime = ageMinutes < 60 ? `${Math.max(1, ageMinutes)} 分鐘前` : ageMinutes < 24 * 60 ? `${Math.floor(ageMinutes / 60)} 小時前` : `${Math.floor(ageMinutes / 1440)} 天前`;
  return {
    id: row.id,
    client: row.clientName,
    company: row.company || "個人委託",
    email: row.email,
    contact: row.contact || row.email || "未填寫",
    projectType: row.projectType,
    services: safeStringArray(row.servicesJson),
    estimate: `${currency.format(row.estimateLow)} – ${currency.format(row.estimateHigh)}`,
    budget: row.budget ? currency.format(row.budget) : "未設定",
    submittedAt: dateTime,
    submittedTime: submittedDate.getTime(),
    relativeTime,
    status: row.status,
    priority: row.priority,
    assignee: row.assignee,
    summary: compactInquirySummary(safeStringArray(row.summaryJson)),
    note: row.note,
    persisted: true,
  };
}

function StatusEditor({ inquiry, updating, onChange }: { inquiry: Inquiry; updating: boolean; onChange: (status: InquiryStatus) => void }) {
  return (
    <div
      className={`status-editor status-${inquiry.status}${updating ? " is-updating" : ""}`}
      aria-busy={updating}
    >
      <span className="status-editor-value"><i />{statusLabels[inquiry.status]}</span>
      <span className="status-editor-chevron" aria-hidden="true">{updating ? "…" : "⌄"}</span>
      <select
        value={inquiry.status}
        disabled={updating}
        aria-label={`修改 ${inquiry.client} 的狀態`}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        onChange={(event) => onChange(event.target.value as InquiryStatus)}
      >
        {editableStatuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
      </select>
    </div>
  );
}

export default function InquiryDashboard({ displayName, previewMode }: { displayName: string; previewMode: boolean }) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>(() => previewMode ? sampleInquiries : []);
  const [activeFilter, setActiveFilter] = useState<StatusView>("todo");
  const [projectFilter, setProjectFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | Priority>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loadError, setLoadError] = useState("");
  const [updatingStatuses, setUpdatingStatuses] = useState<Set<string>>(() => new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [batchStatus, setBatchStatus] = useState<InquiryStatus>("contacted");
  const [batchBusy, setBatchBusy] = useState(false);
  const [batchDeleteArmed, setBatchDeleteArmed] = useState(false);
  const [detailInquiryId, setDetailInquiryId] = useState<string | null>(null);
  const [copiedContactId, setCopiedContactId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/inquiries", { headers: { accept: "application/json" } })
      .then(async (response) => {
        if (!response.ok) throw new Error("無法同步資料庫");
        return response.json() as Promise<{ inquiries?: ApiInquiry[] }>;
      })
      .then((payload) => {
        if (cancelled) return;
        const persistedInquiries = (payload.inquiries ?? []).map(toInquiry);
        if (persistedInquiries.length > 0 || !previewMode) {
          setInquiries(persistedInquiries);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError("目前顯示預覽資料，稍後會自動連上正式回覆。 ");
      });
    return () => { cancelled = true; };
  }, [previewMode]);

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  useEffect(() => {
    function closeQuickDetail(event: KeyboardEvent) {
      if (event.key === "Escape") setDetailInquiryId(null);
    }
    window.addEventListener("keydown", closeQuickDetail);
    return () => window.removeEventListener("keydown", closeQuickDetail);
  }, []);

  const filteredInquiries = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("zh-Hant");
    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return inquiries.filter((inquiry) => {
      const matchesStatus = activeFilter === "all"
        || (activeFilter === "todo" && inquiry.status === "new")
        || (activeFilter === "active" && ["contacted", "quoted"].includes(inquiry.status))
        || (activeFilter === "done" && ["won", "archived"].includes(inquiry.status));
      const matchesProject = projectFilter === "all" || inquiry.projectType === projectFilter;
      const matchesPriority = priorityFilter === "all" || inquiry.priority === priorityFilter;
      const matchesDate = dateFilter === "all"
        || (dateFilter === "today" && inquiry.submittedTime >= startOfToday.getTime())
        || (dateFilter === "week" && inquiry.submittedTime >= now - 7 * 24 * 60 * 60 * 1000)
        || (dateFilter === "month" && inquiry.submittedTime >= now - 30 * 24 * 60 * 60 * 1000);
      const searchable = [inquiry.client, inquiry.company, inquiry.email, inquiry.contact, inquiry.id, ...inquiry.services]
        .join(" ")
        .toLocaleLowerCase("zh-Hant");
      return matchesStatus && matchesProject && matchesPriority && matchesDate && (!keyword || searchable.includes(keyword));
    });
  }, [activeFilter, dateFilter, inquiries, priorityFilter, projectFilter, search]);

  const selectedInquiries = inquiries.filter((inquiry) => selectedIds.has(inquiry.id));
  const filteredIds = filteredInquiries.map((inquiry) => inquiry.id);
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));
  const detailInquiry = inquiries.find((inquiry) => inquiry.id === detailInquiryId) ?? null;

  const newCount = inquiries.filter((inquiry) => inquiry.status === "new").length;
  const activeCount = inquiries.filter((inquiry) => ["contacted", "quoted"].includes(inquiry.status)).length;
  const wonCount = inquiries.filter((inquiry) => inquiry.status === "won").length;
  const completedCount = inquiries.filter((inquiry) => ["won", "archived"].includes(inquiry.status)).length;
  const todayDateKey = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const todayNewCount = inquiries.filter((inquiry) => inquiry.submittedAt.startsWith(todayDateKey)).length;
  const todayParts = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).formatToParts(new Date());
  const todayPart = (type: Intl.DateTimeFormatPartTypes) => todayParts.find((part) => part.type === type)?.value ?? "";
  const todayLabel = `${todayPart("year")}年${todayPart("month")}月${todayPart("day")}日・${todayPart("weekday")}`;
  const extraFilterCount = Number(projectFilter !== "all") + Number(priorityFilter !== "all") + Number(dateFilter !== "all");
  const hasActiveFilters = projectFilter !== "all" || priorityFilter !== "all" || dateFilter !== "all" || search.trim().length > 0;

  function resetFilters() {
    setProjectFilter("all");
    setPriorityFilter("all");
    setDateFilter("all");
  }

  function clearAllFilters() {
    resetFilters();
    setActiveFilter("all");
    setSearch("");
  }

  async function copyContact(inquiry: Inquiry) {
    try {
      await navigator.clipboard.writeText(inquiry.contact);
      setCopiedContactId(inquiry.id);
      window.setTimeout(() => setCopiedContactId((current) => current === inquiry.id ? null : current), 1800);
    } catch {
      setLoadError("無法自動複製，請手動選取聯絡方式。");
    }
  }

  function exportCsv() {
    const rows = [
      ["編號", "收到時間", "客戶", "品牌／公司", "聯絡方式", "合作方式", "服務項目", "網站初估", "預算", "狀態", "負責人"],
      ...filteredInquiries.map((item) => [item.id, item.submittedAt, item.client, item.company, item.contact, item.projectType, item.services.join("、"), item.estimate, item.budget, statusLabels[item.status], item.assignee]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "客戶需求.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function updateInquiryStatus(inquiry: Inquiry, nextStatus: InquiryStatus) {
    if (nextStatus === inquiry.status || updatingStatuses.has(inquiry.id)) return;
    const previousStatus = inquiry.status;
    setLoadError("");
    setInquiries((current) => current.map((item) => item.id === inquiry.id ? { ...item, status: nextStatus } : item));

    if (!inquiry.persisted) return;

    setUpdatingStatuses((current) => new Set(current).add(inquiry.id));
    try {
      const response = await fetch(`/api/inquiries/${encodeURIComponent(inquiry.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error || "更新狀態失敗。");
      }
    } catch (error) {
      setInquiries((current) => current.map((item) => item.id === inquiry.id ? { ...item, status: previousStatus } : item));
      setLoadError(error instanceof Error ? error.message : "更新狀態失敗，請稍後再試。");
    } finally {
      setUpdatingStatuses((current) => {
        const next = new Set(current);
        next.delete(inquiry.id);
        return next;
      });
    }
  }

  function toggleSelection(id: string) {
    setBatchDeleteArmed(false);
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllFiltered() {
    setBatchDeleteArmed(false);
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allFilteredSelected) filteredIds.forEach((id) => next.delete(id));
      else filteredIds.forEach((id) => next.add(id));
      return next;
    });
  }

  async function batchUpdateStatus(nextStatus: InquiryStatus) {
    if (batchBusy || selectedInquiries.length === 0) return;
    setBatchBusy(true);
    setBatchDeleteArmed(false);
    setLoadError("");

    const results = await Promise.all(selectedInquiries.map(async (inquiry) => {
      if (!inquiry.persisted) return { id: inquiry.id, ok: true };
      try {
        const response = await fetch(`/api/inquiries/${encodeURIComponent(inquiry.id)}`, {
          method: "PATCH",
          headers: { "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        });
        return { id: inquiry.id, ok: response.ok };
      } catch {
        return { id: inquiry.id, ok: false };
      }
    }));

    const successfulIds = new Set(results.filter((result) => result.ok).map((result) => result.id));
    const failedIds = new Set(results.filter((result) => !result.ok).map((result) => result.id));
    setInquiries((current) => current.map((inquiry) => successfulIds.has(inquiry.id) ? { ...inquiry, status: nextStatus } : inquiry));
    setSelectedIds(failedIds);
    if (failedIds.size > 0) setLoadError(`${failedIds.size} 筆狀態更新失敗，已保留選取以便重試。`);
    setBatchBusy(false);
  }

  async function batchDelete() {
    if (batchBusy || selectedInquiries.length === 0) return;
    if (!batchDeleteArmed) {
      setBatchDeleteArmed(true);
      return;
    }

    setBatchBusy(true);
    setLoadError("");
    const results = await Promise.all(selectedInquiries.map(async (inquiry) => {
      if (!inquiry.persisted) return { id: inquiry.id, ok: true };
      try {
        const response = await fetch(`/api/inquiries/${encodeURIComponent(inquiry.id)}`, {
          method: "DELETE",
          headers: { accept: "application/json" },
        });
        return { id: inquiry.id, ok: response.ok };
      } catch {
        return { id: inquiry.id, ok: false };
      }
    }));

    const successfulIds = new Set(results.filter((result) => result.ok).map((result) => result.id));
    const failedIds = new Set(results.filter((result) => !result.ok).map((result) => result.id));
    setInquiries((current) => current.filter((inquiry) => !successfulIds.has(inquiry.id)));
    setSelectedIds(failedIds);
    setDetailInquiryId((current) => current && successfulIds.has(current) ? null : current);
    if (failedIds.size > 0) setLoadError(`${failedIds.size} 筆刪除失敗，已保留選取以便重試。`);
    setBatchDeleteArmed(false);
    setBatchBusy(false);
  }

  return (
    <main className="inquiry-app">
      <aside className="inquiry-sidebar">
        <a className="admin-brand" href="/" aria-label="返回 Sam Design Studio 首頁">
          <span className="admin-brand-mark">S</span>
          <span><strong>SAM</strong><small>STUDIO CONSOLE</small></span>
        </a>

        <nav className="admin-nav" aria-label="後台導覽">
          <span className="nav-label">工作台</span>
          <a className="nav-item is-active" href="/admin/inquiries"><span aria-hidden="true">▤</span> 客戶需求 <b>{newCount}</b></a>
          <a className="nav-item" href="#overview"><span aria-hidden="true">◫</span> 數據總覽</a>
          <span className="nav-label">管理</span>
          <a className="nav-item" href="/"><span aria-hidden="true">⌁</span> 前台試算</a>
        </nav>

        <div className="admin-profile">
          <span className="profile-avatar">S</span>
          <span><strong>{displayName}</strong><small>網站管理員</small></span>
        </div>
      </aside>

      <section className="inquiry-main">
        <header className="admin-header">
          <div>
            <p>{todayLabel}</p>
            <h1>客戶需求</h1>
            <span className="admin-header-subtitle">先處理待辦，再接續聯絡與報價。</span>
          </div>
          <div className="header-actions">
            <label className="admin-search">
              <span aria-hidden="true">⌕</span>
              <span className="sr-only">搜尋客戶需求</span>
              <input ref={searchInputRef} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜尋姓名、品牌或需求…" />
              <kbd>⌘ K</kbd>
            </label>
            <a className="primary-admin-button" href="/" target="_blank">開啟前台試算</a>
          </div>
        </header>

        {loadError && <div className="admin-sync-note" role="status">{loadError}</div>}

        <section className="metric-grid" id="overview" aria-label="需求處理摘要">
          <article className="metric-card">
            <span className="metric-icon" aria-hidden="true">!</span>
            <div><span>待處理</span><strong>{newCount}</strong><small><b>優先確認</b><i>尚未開始聯絡</i></small></div>
          </article>
          <article className="metric-card">
            <span className="metric-icon" aria-hidden="true">●</span>
            <div><span>處理中</span><strong>{activeCount}</strong><small><b>持續跟進</b><i>已聯絡或已報價</i></small></div>
          </article>
          <article className="metric-card">
            <span className="metric-icon" aria-hidden="true">✓</span>
            <div><span>已成交</span><strong>{wonCount}</strong><small><b>合作確認</b><i>共 {completedCount} 筆已完成</i></small></div>
          </article>
          <article className="metric-card">
            <span className="metric-icon" aria-hidden="true">＋</span>
            <div><span>今日新增</span><strong>{todayNewCount}</strong><small><b>即時統計</b><i>今天收到的需求</i></small></div>
          </article>
        </section>

        <section className="response-panel">
          <div className="panel-heading">
            <div><h2>全部需求</h2><span>目前顯示 {filteredInquiries.length} 筆</span></div>
            <div className="panel-tools">
              <div className="filter-control">
                <button className={filterOpen || extraFilterCount > 0 ? "is-active" : ""} type="button" aria-expanded={filterOpen} aria-controls="inquiry-filter-menu" onClick={() => setFilterOpen((current) => !current)}>
                  篩選{extraFilterCount > 0 && <b>{extraFilterCount}</b>} <span>{filterOpen ? "⌃" : "⌄"}</span>
                </button>
                {filterOpen && (
                  <div className="filter-popover" id="inquiry-filter-menu" role="dialog" aria-label="篩選客戶需求">
                    <div className="filter-popover-heading"><strong>篩選需求</strong><button type="button" onClick={() => setFilterOpen(false)} aria-label="關閉篩選">×</button></div>
                    <label><span>合作方式</span><select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}><option value="all">全部方式</option><option value="單次設計">單次設計</option><option value="月方案">月方案</option></select></label>
                    <label><span>優先順序</span><select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as "all" | Priority)}><option value="all">全部</option><option value="high">優先</option><option value="normal">一般</option><option value="low">稍後處理</option></select></label>
                    <label><span>收到時間</span><select value={dateFilter} onChange={(event) => setDateFilter(event.target.value as DateFilter)}><option value="all">不限時間</option><option value="today">今天收到</option><option value="week">最近 7 天</option><option value="month">最近 30 天</option></select></label>
                    <div className="filter-popover-actions"><button type="button" onClick={resetFilters}>清除條件</button><button type="button" onClick={() => setFilterOpen(false)}>完成</button></div>
                  </div>
                )}
              </div>
              <button type="button" onClick={exportCsv}>下載資料</button>
            </div>
          </div>

          <div className="status-tabs" role="tablist" aria-label="依狀態篩選">
            {filters.map((filter) => {
              const count = filter.key === "all"
                ? inquiries.length
                : filter.key === "todo"
                  ? newCount
                  : filter.key === "active"
                    ? activeCount
                    : completedCount;
              return (
                <button key={filter.key} className={activeFilter === filter.key ? "is-active" : ""} type="button" role="tab" aria-selected={activeFilter === filter.key} onClick={() => setActiveFilter(filter.key)}>
                  {filter.label}<span>{count}</span>
                </button>
              );
            })}
          </div>

          {hasActiveFilters && (
            <div className="active-filter-bar" aria-label="目前篩選條件">
              <span>目前顯示</span>
              {search.trim() && <button type="button" onClick={() => setSearch("")}>搜尋：{search.trim()} <i>×</i></button>}
              {projectFilter !== "all" && <button type="button" onClick={() => setProjectFilter("all")}>方式：{projectFilter} <i>×</i></button>}
              {priorityFilter !== "all" && <button type="button" onClick={() => setPriorityFilter("all")}>順序：{priorityLabels[priorityFilter]} <i>×</i></button>}
              {dateFilter !== "all" && <button type="button" onClick={() => setDateFilter("all")}>時間：{dateFilterLabels[dateFilter]} <i>×</i></button>}
              <button className="clear-filter-button" type="button" onClick={clearAllFilters}>清除全部</button>
            </div>
          )}

          {selectedInquiries.length > 0 && (
            <div className="batch-action-bar" aria-label="批次管理">
              <div className="batch-action-summary">
                <strong>已選取 {selectedInquiries.length} 筆</strong>
                <button type="button" onClick={() => { setSelectedIds(new Set()); setBatchDeleteArmed(false); }}>取消選取</button>
              </div>
              <div className="batch-action-controls">
                <label>
                  <span className="sr-only">批次修改狀態</span>
                  <select value={batchStatus} disabled={batchBusy} onChange={(event) => setBatchStatus(event.target.value as InquiryStatus)}>
                    {editableStatuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
                  </select>
                </label>
                <button type="button" disabled={batchBusy} onClick={() => batchUpdateStatus(batchStatus)}>更新狀態</button>
                <button type="button" disabled={batchBusy} onClick={() => batchUpdateStatus("archived")}>封存</button>
                <button className={`batch-delete${batchDeleteArmed ? " is-armed" : ""}`} type="button" disabled={batchBusy} onClick={batchDelete}>
                  {batchDeleteArmed ? `確認刪除 ${selectedInquiries.length} 筆` : "刪除"}
                </button>
              </div>
            </div>
          )}

          <div className="response-table-wrap">
            <table className="response-table">
              <thead><tr><th><input className="selection-checkbox" type="checkbox" checked={allFilteredSelected} onChange={toggleAllFiltered} aria-label="選取目前顯示的全部需求" /></th><th>客戶／品牌</th><th>服務項目</th><th>網站初估</th><th>收到時間</th><th>狀態</th><th><span className="sr-only">操作</span></th></tr></thead>
              <tbody>
                {filteredInquiries.map((inquiry) => (
                  <tr key={inquiry.id} className={`is-clickable${selectedIds.has(inquiry.id) ? " is-selected" : ""}`} tabIndex={0} role="button" aria-label={`查看 ${inquiry.client} 的需求`} onClick={() => setDetailInquiryId(inquiry.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setDetailInquiryId(inquiry.id); }}>
                    <td><input className="selection-checkbox" type="checkbox" checked={selectedIds.has(inquiry.id)} onClick={(event) => event.stopPropagation()} onChange={() => toggleSelection(inquiry.id)} aria-label={`選取 ${inquiry.client} 的需求`} /></td>
                    <td><div className="client-cell"><span className="client-avatar">{inquiry.client.slice(0, 1)}<i className={`priority-dot priority-${inquiry.priority}`} /></span><span><strong>{inquiry.client}</strong><small>{inquiry.company}・{inquiry.id}</small></span></div></td>
                    <td><div className="service-tags">{inquiry.services.slice(0, 2).map((service) => <span key={service}>{service}</span>)}</div></td>
                    <td><strong className="estimate-cell">{inquiry.estimate}</strong></td>
                    <td><span className="time-cell">{inquiry.relativeTime}</span><small>{inquiry.submittedAt.slice(0, 10)}</small></td>
                    <td><StatusEditor inquiry={inquiry} updating={updatingStatuses.has(inquiry.id)} onChange={(status) => updateInquiryStatus(inquiry, status)} /></td>
                    <td><button className="row-view" type="button" onClick={(event) => { event.stopPropagation(); setDetailInquiryId(inquiry.id); }} aria-label={`查看 ${inquiry.client} 的需求`}>查看需求</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mobile-response-list">
              {filteredInquiries.map((inquiry) => (
                <article key={inquiry.id} className={`mobile-response-card${selectedIds.has(inquiry.id) ? " is-selected" : ""}`}>
                  <div className="mobile-card-topline"><span className="mobile-card-select"><input className="selection-checkbox" type="checkbox" checked={selectedIds.has(inquiry.id)} onChange={() => toggleSelection(inquiry.id)} aria-label={`選取 ${inquiry.client} 的需求`} /><StatusEditor inquiry={inquiry} updating={updatingStatuses.has(inquiry.id)} onChange={(status) => updateInquiryStatus(inquiry, status)} /></span><small>{inquiry.relativeTime}</small></div>
                  <button className="mobile-card-open" type="button" onClick={() => setDetailInquiryId(inquiry.id)} aria-label={`查看 ${inquiry.client} 的需求`}>
                    <span className="mobile-card-identity"><span className="client-avatar">{inquiry.client.slice(0, 1)}<i className={`priority-dot priority-${inquiry.priority}`} /></span><span><strong>{inquiry.client}</strong><small>{inquiry.company}・{inquiry.id}</small></span><b aria-hidden="true">查看</b></span>
                    <span className="mobile-card-services">{inquiry.services.slice(0, 3).map((service) => <i key={service}>{service}</i>)}</span>
                    <span className="mobile-card-footer"><span><small>網站初估</small><strong>{inquiry.estimate}</strong></span><span><small>收到時間</small><strong>{inquiry.relativeTime}</strong></span></span>
                  </button>
                </article>
              ))}
            </div>
            {filteredInquiries.length === 0 && <div className="empty-responses"><span>⌕</span><strong>找不到符合的需求</strong><small>試著清除搜尋文字或切換篩選條件。</small></div>}
          </div>
        </section>
      </section>

      {detailInquiry && (
        <div className="quick-detail-layer">
          <button className="quick-detail-backdrop" type="button" onClick={() => setDetailInquiryId(null)} aria-label="關閉需求內容" />
          <aside className="quick-detail-panel" role="dialog" aria-modal="true" aria-labelledby="quick-detail-title">
            <header className="quick-detail-header">
              <div><span>查看需求</span><strong>{detailInquiry.id}</strong></div>
              <button type="button" onClick={() => setDetailInquiryId(null)} aria-label="關閉需求內容">×</button>
            </header>
            <div className="quick-detail-scroll">
              <div className="quick-detail-identity">
                <span className="detail-avatar">{detailInquiry.client.slice(0, 1)}</span>
                <div><h2 id="quick-detail-title">{detailInquiry.client}</h2><p>{detailInquiry.company}・{detailInquiry.projectType}</p></div>
              </div>
              <div className="quick-detail-status">
                <span>目前狀態</span>
                <StatusEditor inquiry={detailInquiry} updating={updatingStatuses.has(detailInquiry.id)} onChange={(status) => updateInquiryStatus(detailInquiry, status)} />
              </div>
              <section className="quick-detail-section">
                <h3>聯絡與負責</h3>
                <dl className="quick-detail-meta">
                  <div><dt>Email</dt><dd><a href={`mailto:${detailInquiry.email}`}>{detailInquiry.email}</a></dd></div>
                  <div><dt>您的聯絡方式</dt><dd><button className={`quick-contact-copy${copiedContactId === detailInquiry.id ? " is-copied" : ""}`} type="button" onClick={() => copyContact(detailInquiry)} title="點擊複製聯絡方式"><span>{detailInquiry.contact}</span><small aria-live="polite">{copiedContactId === detailInquiry.id ? "已複製" : "點擊複製"}</small></button></dd></div>
                  <div><dt>負責人</dt><dd>{detailInquiry.assignee || "尚未指派"}</dd></div>
                  <div><dt>收到時間</dt><dd>{detailInquiry.submittedAt}</dd></div>
                </dl>
              </section>
              <section className="quick-detail-section">
                <h3>需求摘要</h3>
                <div className="quick-detail-tags">{detailInquiry.services.map((service) => <span key={service}>{service}</span>)}</div>
                <ul className="quick-detail-summary">{detailInquiry.summary.map((item, index) => <li key={`${item}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span>{item}</li>)}</ul>
                <div className="quick-detail-estimate"><span><small>網站初估</small><strong>{detailInquiry.estimate}</strong></span><span><small>客戶預算</small><strong>{detailInquiry.budget}</strong></span></div>
              </section>
              {detailInquiry.note && <section className="quick-detail-section"><h3>內部備註</h3><p className="quick-detail-note">{detailInquiry.note}</p></section>}
            </div>
            <footer className="quick-detail-footer">
              <a href={`mailto:${detailInquiry.email}`}>寄送 Email</a>
              <a className="quick-detail-primary" href={`/admin/inquiries/${encodeURIComponent(detailInquiry.id)}`}>查看完整內容</a>
            </footer>
          </aside>
        </div>
      )}
    </main>
  );
}

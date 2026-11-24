"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { compactInquirySummary } from "./compact-summary";
import { caseStageLabels, defaultWorkflowAction, editableCaseStages, getActionAfterResponse, getOtherWorkflowActionsForStage, getQuickWorkflowActionsForStage, getSuggestedFollowUpAt, getWorkflowAction, normalizeCaseStage, type CaseStage } from "./workflow-options";

type InquiryStatus = CaseStage;
type ReplyStatus = "needs_reply" | "waiting_client" | "client_replied" | "scheduled" | "paused" | "completed";
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
  replyStatus: ReplyStatus;
  priority: Priority;
  assignee: string;
  lastContactAt: string;
  nextFollowUpAt: string;
  nextFollowUpTime: number | null;
  nextAction: string;
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
  status: string;
  replyStatus: ReplyStatus;
  priority: Priority;
  assignee: string;
  lastContactAt: string | null;
  nextFollowUpAt: string | null;
  nextAction: string;
  note: string;
};

// Preview mode intentionally starts empty. Inquiry examples previously used realistic
// contact details, which should not be published in a public source repository.
const sampleInquiries: Inquiry[] = [];

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

const filters: Array<{ key: StatusView; label: string }> = [
  { key: "todo", label: "待我處理" },
  { key: "active", label: "追蹤中" },
  { key: "done", label: "已完成" },
  { key: "all", label: "全部" },
];

const dateFilterLabels: Record<DateFilter, string> = {
  all: "不限時間",
  today: "今天收到",
  week: "最近 7 天",
  month: "最近 30 天",
};

const editableStatuses = editableCaseStages;

const currency = new Intl.NumberFormat("zh-TW", { style: "currency", currency: "TWD", maximumFractionDigits: 0 });

function safeStringArray(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function formatTaipeiDateTime(value: string) {
  if (!value) return "尚未設定";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "尚未設定";
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function taipeiDateKey(value: string | number) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function toDateTimeLocalValue(value: string) {
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
    estimate: row.estimateLow === 0 && row.estimateHigh === 0 ? "尚未估價" : `${currency.format(row.estimateLow)} – ${currency.format(row.estimateHigh)}`,
    budget: row.budget ? currency.format(row.budget) : "未設定",
    submittedAt: dateTime,
    submittedTime: submittedDate.getTime(),
    relativeTime,
    status: normalizeCaseStage(row.status, row.nextAction),
    replyStatus: row.replyStatus || "needs_reply",
    priority: row.priority,
    assignee: row.assignee,
    lastContactAt: row.lastContactAt || "",
    nextFollowUpAt: row.nextFollowUpAt || "",
    nextFollowUpTime: row.nextFollowUpAt ? new Date(row.nextFollowUpAt).getTime() : null,
    nextAction: row.nextAction || "",
    summary: compactInquirySummary(safeStringArray(row.summaryJson)),
    note: row.note,
    persisted: true,
  };
}

function ReplyStatusBadge({ status }: { status: ReplyStatus }) {
  return <span className={`reply-status reply-${status}`}><i />{replyStatusLabels[status]}</span>;
}

function isInquiryOverdue(inquiry: Inquiry, now: number) {
  return inquiry.nextFollowUpTime !== null && inquiry.nextFollowUpTime < now && inquiry.replyStatus !== "completed";
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
  const [createCustomerOpen, setCreateCustomerOpen] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [createCustomerError, setCreateCustomerError] = useState("");
  const [search, setSearch] = useState("");
  const [loadError, setLoadError] = useState("");
  const [updatingStatuses, setUpdatingStatuses] = useState<Set<string>>(() => new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [batchStatus, setBatchStatus] = useState<InquiryStatus>("negotiating");
  const [batchBusy, setBatchBusy] = useState(false);
  const [batchDeleteArmed, setBatchDeleteArmed] = useState(false);
  const [detailInquiryId, setDetailInquiryId] = useState<string | null>(null);
  const [quickWorkflowOpen, setQuickWorkflowOpen] = useState(false);
  const [quickDateOpen, setQuickDateOpen] = useState(false);
  const [copiedContactId, setCopiedContactId] = useState<string | null>(null);
  const [dashboardNow] = useState(() => new Date().getTime());
  const defaultFollowUpAt = new Date(dashboardNow + 5 * 24 * 60 * 60 * 1000).toISOString();

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
      if (event.key === "Escape") {
        setDetailInquiryId(null);
        if (!creatingCustomer) setCreateCustomerOpen(false);
      }
    }
    window.addEventListener("keydown", closeQuickDetail);
    return () => window.removeEventListener("keydown", closeQuickDetail);
  }, [creatingCustomer]);

  const filteredInquiries = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("zh-Hant");
    const startOfToday = new Date(dashboardNow);
    startOfToday.setHours(0, 0, 0, 0);
    return inquiries.filter((inquiry) => {
      const isOverdue = inquiry.nextFollowUpTime !== null
        && inquiry.nextFollowUpTime < dashboardNow
        && inquiry.replyStatus !== "completed";
      const matchesStatus = activeFilter === "all"
        || (activeFilter === "todo" && (["needs_reply", "client_replied"].includes(inquiry.replyStatus) || isOverdue))
        || (activeFilter === "active" && ["waiting_client", "scheduled", "paused"].includes(inquiry.replyStatus))
        || (activeFilter === "done" && (inquiry.replyStatus === "completed" || ["completed", "lost", "archived"].includes(inquiry.status)));
      const matchesProject = projectFilter === "all" || inquiry.projectType === projectFilter;
      const matchesPriority = priorityFilter === "all" || inquiry.priority === priorityFilter;
      const matchesDate = dateFilter === "all"
        || (dateFilter === "today" && inquiry.submittedTime >= startOfToday.getTime())
        || (dateFilter === "week" && inquiry.submittedTime >= dashboardNow - 7 * 24 * 60 * 60 * 1000)
        || (dateFilter === "month" && inquiry.submittedTime >= dashboardNow - 30 * 24 * 60 * 60 * 1000);
      const searchable = [inquiry.client, inquiry.company, inquiry.email, inquiry.contact, inquiry.id, ...inquiry.services]
        .join(" ")
        .toLocaleLowerCase("zh-Hant");
      return matchesStatus && matchesProject && matchesPriority && matchesDate && (!keyword || searchable.includes(keyword));
    }).sort((left, right) => {
      const urgency = (inquiry: Inquiry) => {
        if (inquiry.nextFollowUpTime !== null && inquiry.nextFollowUpTime < dashboardNow && inquiry.replyStatus !== "completed") return 0;
        if (inquiry.replyStatus === "client_replied") return 1;
        if (inquiry.replyStatus === "needs_reply") return 2;
        if (inquiry.nextFollowUpTime !== null) return 3;
        return 4;
      };
      return urgency(left) - urgency(right) || (left.nextFollowUpTime ?? Number.MAX_SAFE_INTEGER) - (right.nextFollowUpTime ?? Number.MAX_SAFE_INTEGER) || right.submittedTime - left.submittedTime;
    });
  }, [activeFilter, dashboardNow, dateFilter, inquiries, priorityFilter, projectFilter, search]);

  const selectedInquiries = inquiries.filter((inquiry) => selectedIds.has(inquiry.id));
  const filteredIds = filteredInquiries.map((inquiry) => inquiry.id);
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));
  const detailInquiry = inquiries.find((inquiry) => inquiry.id === detailInquiryId) ?? null;
  const quickWorkflowActions = detailInquiry ? getQuickWorkflowActionsForStage(detailInquiry.status, detailInquiry.nextAction) : [];
  const otherWorkflowActions = detailInquiry ? getOtherWorkflowActionsForStage(detailInquiry.status, quickWorkflowActions) : [];
  const relatedInquiries = detailInquiry ? inquiries.filter((inquiry) => {
    const sameContact = detailInquiry.contact !== "未填寫" && inquiry.contact === detailInquiry.contact;
    return inquiry.id !== detailInquiry.id && (sameContact || (inquiry.client === detailInquiry.client && inquiry.company === detailInquiry.company));
  }) : [];

  const newCount = inquiries.filter((inquiry) => inquiry.replyStatus === "needs_reply").length;
  const waitingClientCount = inquiries.filter((inquiry) => inquiry.replyStatus === "waiting_client").length;
  const clientRepliedCount = inquiries.filter((inquiry) => inquiry.replyStatus === "client_replied").length;
  const needsReplyCount = newCount + clientRepliedCount;
  const activeCount = inquiries.filter((inquiry) => ["waiting_client", "scheduled", "paused"].includes(inquiry.replyStatus)).length;
  const completedCount = inquiries.filter((inquiry) => inquiry.replyStatus === "completed" || ["completed", "lost", "archived"].includes(inquiry.status)).length;
  const todayDateKey = taipeiDateKey(dashboardNow);
  const todayFollowUpCount = inquiries.filter((inquiry) => inquiry.nextFollowUpAt && taipeiDateKey(inquiry.nextFollowUpAt) === todayDateKey && inquiry.replyStatus !== "completed").length;
  const overdueCount = inquiries.filter((inquiry) => inquiry.nextFollowUpTime !== null && inquiry.nextFollowUpTime < dashboardNow && inquiry.replyStatus !== "completed").length;
  const todoCount = inquiries.filter((inquiry) => ["needs_reply", "client_replied"].includes(inquiry.replyStatus) || isInquiryOverdue(inquiry, dashboardNow)).length;
  const customerCount = new Set(inquiries.map((inquiry) => inquiry.contact !== "未填寫" ? inquiry.contact : `${inquiry.client}|${inquiry.company}`)).size;
  const scheduledInquiries = inquiries
    .filter((inquiry) => inquiry.nextFollowUpTime !== null && inquiry.replyStatus !== "completed")
    .sort((left, right) => (left.nextFollowUpTime ?? Number.MAX_SAFE_INTEGER) - (right.nextFollowUpTime ?? Number.MAX_SAFE_INTEGER))
    .slice(0, 6);
  const todayParts = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).formatToParts(new Date(dashboardNow));
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

  function openInquiryDetail(inquiry: Inquiry) {
    setQuickWorkflowOpen(false);
    setQuickDateOpen(false);
    setDetailInquiryId(inquiry.id);
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

  async function createManualCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const initialNeed = String(formData.get("initialNeed") ?? "").trim();
    const optionalAmount = (name: string) => {
      const rawValue = String(formData.get(name) ?? "").trim();
      if (!rawValue) return undefined;
      const amount = Number(rawValue);
      return Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : undefined;
    };
    const enteredEstimateLow = optionalAmount("estimateLow");
    const enteredEstimateHigh = optionalAmount("estimateHigh");
    const estimateLow = enteredEstimateLow ?? enteredEstimateHigh ?? 0;
    const estimateHigh = enteredEstimateHigh ?? enteredEstimateLow ?? 0;
    const budget = optionalAmount("budget");
    if (estimateHigh < estimateLow) {
      setCreateCustomerError("初估最高金額不可低於最低金額。");
      return;
    }
    setCreatingCustomer(true);
    setCreateCustomerError("");
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          source: "admin",
          clientName: String(formData.get("clientName") ?? ""),
          company: String(formData.get("company") ?? ""),
          contact: String(formData.get("contact") ?? ""),
          projectType: String(formData.get("projectType") ?? "尚未確認"),
          estimateLow,
          estimateHigh,
          budget,
          services: ["需求待確認"],
          summary: initialNeed ? [`初步需求：${initialNeed}`] : [],
        }),
      });
      const payload = await response.json() as { inquiry?: ApiInquiry; error?: string };
      if (!response.ok || !payload.inquiry) throw new Error(payload.error || "新增客戶失敗，請再試一次。");
      const createdInquiry = toInquiry(payload.inquiry);
      setInquiries((current) => [createdInquiry, ...current]);
      setActiveFilter("todo");
      setCreateCustomerOpen(false);
      setQuickWorkflowOpen(false);
      setQuickDateOpen(false);
      setDetailInquiryId(createdInquiry.id);
      form.reset();
    } catch (error) {
      setCreateCustomerError(error instanceof Error ? error.message : "新增客戶失敗，請再試一次。");
    } finally {
      setCreatingCustomer(false);
    }
  }

  function exportCsv() {
    const rows = [
      ["編號", "收到時間", "客戶", "品牌／公司", "聯絡方式", "合作方式", "服務項目", "網站初估", "預算", "回覆狀況", "案件進度", "下一步", "下次追蹤", "最後聯絡", "負責人"],
      ...filteredInquiries.map((item) => [item.id, item.submittedAt, item.client, item.company, item.contact, item.projectType, item.services.join("、"), item.estimate, item.budget, replyStatusLabels[item.replyStatus], statusLabels[item.status], item.nextAction, formatTaipeiDateTime(item.nextFollowUpAt), formatTaipeiDateTime(item.lastContactAt), item.assignee]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "客戶需求.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function updateInquiryFields(
    inquiry: Inquiry,
    patch: Partial<Pick<Inquiry, "status" | "replyStatus" | "priority" | "assignee" | "lastContactAt" | "nextFollowUpAt" | "nextAction" | "note">>,
  ) {
    if (updatingStatuses.has(inquiry.id)) return;
    const previousInquiry = inquiry;
    const optimisticPatch = {
      ...patch,
      ...(patch.nextFollowUpAt !== undefined
        ? { nextFollowUpTime: patch.nextFollowUpAt ? new Date(patch.nextFollowUpAt).getTime() : null }
        : {}),
    };
    setLoadError("");
    setInquiries((current) => current.map((item) => item.id === inquiry.id ? { ...item, ...optimisticPatch } : item));

    if (!inquiry.persisted) return;

    setUpdatingStatuses((current) => new Set(current).add(inquiry.id));
    try {
      const response = await fetch(`/api/inquiries/${encodeURIComponent(inquiry.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(patch),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error || "更新客戶進度失敗。");
      }
    } catch (error) {
      setInquiries((current) => current.map((item) => item.id === inquiry.id ? previousInquiry : item));
      setLoadError(error instanceof Error ? error.message : "更新客戶進度失敗，請稍後再試。");
    } finally {
      setUpdatingStatuses((current) => {
        const next = new Set(current);
        next.delete(inquiry.id);
        return next;
      });
    }
  }

  async function updateInquiryStatus(inquiry: Inquiry, nextStatus: InquiryStatus) {
    if (nextStatus === inquiry.status) return;
    await updateInquiryFields(inquiry, { status: nextStatus });
  }

  async function saveFollowUp(event: FormEvent<HTMLFormElement>, inquiry: Inquiry) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextAction = String(formData.get("nextAction") ?? defaultWorkflowAction.value);
    const workflowAction = getWorkflowAction(nextAction) ?? defaultWorkflowAction;
    const followUpPreset = String(formData.get("followUpPreset") ?? "current");
    const customFollowUp = String(formData.get("customFollowUpAt") ?? "");
    const actionChanged = nextAction !== inquiry.nextAction;
    const nextFollowUpAt = followUpPreset === "current"
      ? actionChanged ? getSuggestedFollowUpAt(workflowAction) : inquiry.nextFollowUpAt || getSuggestedFollowUpAt(workflowAction)
      : customFollowUp ? new Date(customFollowUp).toISOString() : inquiry.nextFollowUpAt || getSuggestedFollowUpAt(workflowAction);
    await updateInquiryFields(inquiry, {
      status: workflowAction.caseStage,
      replyStatus: workflowAction.replyStatus,
      nextFollowUpAt: workflowAction.followUpDays === null ? "" : nextFollowUpAt,
      nextAction,
    });
    setQuickWorkflowOpen(false);
    setQuickDateOpen(false);
  }

  async function markResponded(inquiry: Inquiry) {
    const responseAction = getActionAfterResponse(inquiry.nextAction);
    await updateInquiryFields(inquiry, {
      status: responseAction.caseStage,
      replyStatus: responseAction.replyStatus,
      lastContactAt: new Date().toISOString(),
      nextAction: responseAction.value,
      nextFollowUpAt: getSuggestedFollowUpAt(responseAction),
    });
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
          <a className="nav-item is-active" href="/admin/inquiries"><span aria-hidden="true">▤</span> 客戶需求 <b>{needsReplyCount}</b></a>
          <a className="nav-item" href="#schedule"><span aria-hidden="true">◫</span> 今日排程</a>
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
            <h1>客戶工作台</h1>
            <span className="admin-header-subtitle">{customerCount} 位客戶・先處理待回覆與今日追蹤。</span>
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
            <div><span>待我回覆</span><strong>{needsReplyCount}</strong><small><b>優先處理</b><i>{clientRepliedCount} 位客戶已回覆</i></small></div>
          </article>
          <article className="metric-card">
            <span className="metric-icon" aria-hidden="true">●</span>
            <div><span>等待客戶</span><strong>{waitingClientCount}</strong><small><b>持續跟進</b><i>已回覆，等待客戶確認</i></small></div>
          </article>
          <article className="metric-card">
            <span className="metric-icon" aria-hidden="true">◷</span>
            <div><span>今日追蹤</span><strong>{todayFollowUpCount}</strong><small><b>依排程處理</b><i>今天需要再次聯絡</i></small></div>
          </article>
          <article className={`metric-card${overdueCount > 0 ? " is-urgent" : ""}`}>
            <span className="metric-icon" aria-hidden="true">⌁</span>
            <div><span>已逾期</span><strong>{overdueCount}</strong><small><b>{overdueCount > 0 ? "需要注意" : "目前正常"}</b><i>超過追蹤時間</i></small></div>
          </article>
        </section>

        <section className="follow-up-board" id="schedule" aria-labelledby="follow-up-title">
          <div className="follow-up-heading">
            <div><span>今日工作</span><h2 id="follow-up-title">近期追蹤排程</h2></div>
            <small>依時間自動排序，逾期項目會優先顯示</small>
          </div>
          {scheduledInquiries.length > 0 ? (
            <div className="follow-up-list">
              {scheduledInquiries.map((inquiry) => {
                const isOverdue = inquiry.nextFollowUpTime !== null && inquiry.nextFollowUpTime < dashboardNow;
                return (
                  <button key={inquiry.id} className={isOverdue ? "is-overdue" : ""} type="button" onClick={() => openInquiryDetail(inquiry)}>
                    <span className="follow-up-time"><strong>{formatTaipeiDateTime(inquiry.nextFollowUpAt)}</strong><small>{isOverdue ? "已逾期" : "已排程"}</small></span>
                    <span className="follow-up-client"><strong>{inquiry.client}</strong><small>{inquiry.company}</small></span>
                    <span className="follow-up-action"><strong>{inquiry.nextAction || "聯絡客戶並確認下一步"}</strong><small>{inquiry.services.slice(0, 2).join("、")}</small></span>
                    <ReplyStatusBadge status={inquiry.replyStatus} />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="follow-up-empty"><span>✓</span><div><strong>目前沒有追蹤排程</strong><small>從客戶需求右側面板設定下一次聯絡時間。</small></div></div>
          )}
        </section>

        <section className="response-panel">
          <div className="panel-heading">
            <div><h2>客戶與需求</h2><span>目前顯示 {filteredInquiries.length} 筆</span></div>
            <div className="panel-tools">
              <button className="add-customer-button" type="button" onClick={() => { setCreateCustomerError(""); setCreateCustomerOpen(true); }}>新增客戶</button>
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
                  ? todoCount
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
              <thead><tr><th><input className="selection-checkbox" type="checkbox" checked={allFilteredSelected} onChange={toggleAllFiltered} aria-label="選取目前顯示的全部需求" /></th><th>客戶／品牌</th><th>需求項目</th><th>網站初估</th><th>回覆狀況</th><th>下次追蹤</th><th>案件進度</th><th><span className="sr-only">操作</span></th></tr></thead>
              <tbody>
                {filteredInquiries.map((inquiry) => (
                  <tr key={inquiry.id} className={`is-clickable${selectedIds.has(inquiry.id) ? " is-selected" : ""}`} tabIndex={0} role="button" aria-label={`查看 ${inquiry.client} 的需求`} onClick={() => openInquiryDetail(inquiry)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") openInquiryDetail(inquiry); }}>
                    <td><input className="selection-checkbox" type="checkbox" checked={selectedIds.has(inquiry.id)} onClick={(event) => event.stopPropagation()} onChange={() => toggleSelection(inquiry.id)} aria-label={`選取 ${inquiry.client} 的需求`} /></td>
                    <td><div className="client-cell"><span className="client-avatar">{inquiry.client.slice(0, 1)}<i className={`priority-dot priority-${inquiry.priority}`} /></span><span><strong>{inquiry.client}</strong><small>{inquiry.company}・{inquiry.relativeTime}</small></span></div></td>
                    <td><div className="service-tags">{inquiry.services.slice(0, 2).map((service) => <span key={service}>{service}</span>)}</div></td>
                    <td><strong className="estimate-cell">{inquiry.estimate}</strong></td>
                    <td><ReplyStatusBadge status={inquiry.replyStatus} /></td>
                    <td><span className={`follow-up-cell${isInquiryOverdue(inquiry, dashboardNow) ? " is-overdue" : ""}`}><strong>{inquiry.nextFollowUpAt ? formatTaipeiDateTime(inquiry.nextFollowUpAt) : "尚未安排"}</strong><small>{inquiry.nextAction || "設定下一步"}</small></span></td>
                    <td><StatusEditor inquiry={inquiry} updating={updatingStatuses.has(inquiry.id)} onChange={(status) => updateInquiryStatus(inquiry, status)} /></td>
                    <td><button className="row-view" type="button" onClick={(event) => { event.stopPropagation(); openInquiryDetail(inquiry); }} aria-label={`查看 ${inquiry.client} 的需求`}>查看需求</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mobile-response-list">
              {filteredInquiries.map((inquiry) => (
                <article key={inquiry.id} className={`mobile-response-card${selectedIds.has(inquiry.id) ? " is-selected" : ""}`}>
                  <div className="mobile-card-topline"><span className="mobile-card-select"><input className="selection-checkbox" type="checkbox" checked={selectedIds.has(inquiry.id)} onChange={() => toggleSelection(inquiry.id)} aria-label={`選取 ${inquiry.client} 的需求`} /><ReplyStatusBadge status={inquiry.replyStatus} /></span><small>{inquiry.relativeTime}</small></div>
                  <button className="mobile-card-open" type="button" onClick={() => openInquiryDetail(inquiry)} aria-label={`查看 ${inquiry.client} 的需求`}>
                    <span className="mobile-card-identity"><span className="client-avatar">{inquiry.client.slice(0, 1)}<i className={`priority-dot priority-${inquiry.priority}`} /></span><span><strong>{inquiry.client}</strong><small>{inquiry.company}・{inquiry.id}</small></span><b aria-hidden="true">查看</b></span>
                    <span className="mobile-card-services">{inquiry.services.slice(0, 3).map((service) => <i key={service}>{service}</i>)}</span>
                    <span className="mobile-card-footer"><span><small>下次追蹤</small><strong>{inquiry.nextFollowUpAt ? formatTaipeiDateTime(inquiry.nextFollowUpAt) : "尚未安排"}</strong></span><span><small>案件進度</small><strong>{statusLabels[inquiry.status]}</strong></span></span>
                  </button>
                </article>
              ))}
            </div>
            {filteredInquiries.length === 0 && <div className="empty-responses"><span>⌕</span><strong>找不到符合的需求</strong><small>試著清除搜尋文字或切換篩選條件。</small></div>}
          </div>
        </section>
      </section>

      {createCustomerOpen && (
        <div className="create-customer-layer">
          <button className="create-customer-backdrop" type="button" disabled={creatingCustomer} onClick={() => setCreateCustomerOpen(false)} aria-label="關閉新增客戶表單" />
          <section className="create-customer-dialog" role="dialog" aria-modal="true" aria-labelledby="create-customer-title">
            <header>
              <div><span>客戶與需求</span><h2 id="create-customer-title">新增客戶</h2></div>
              <button type="button" disabled={creatingCustomer} onClick={() => setCreateCustomerOpen(false)} aria-label="關閉新增客戶表單">×</button>
            </header>
            <form onSubmit={(event) => { void createManualCustomer(event); }}>
              <p>先建立基本資料，其他需求與排程可之後再補充。</p>
              <label><span>客戶名稱 *</span><input name="clientName" required maxLength={80} placeholder="例如：王小姐" /></label>
              <label><span>聯絡方式 *</span><input name="contact" required maxLength={180} placeholder="LINE、電話或 Email" /></label>
              <label><span>品牌／公司</span><input name="company" maxLength={120} placeholder="可留空" /></label>
              <label><span>合作方式</span><select name="projectType" defaultValue="尚未確認"><option value="尚未確認">尚未確認</option><option value="單次設計">單次設計</option><option value="月方案">月方案</option></select></label>
              <div className="create-customer-money-fields">
                <label><span>初估最低</span><input name="estimateLow" type="number" inputMode="numeric" min="0" step="100" placeholder="可留空" /></label>
                <label><span>初估最高</span><input name="estimateHigh" type="number" inputMode="numeric" min="0" step="100" placeholder="可留空" /></label>
              </div>
              <label><span>客戶預算</span><input name="budget" type="number" inputMode="numeric" min="0" step="100" placeholder="可留空" /></label>
              <label><span>初步需求</span><textarea name="initialNeed" rows={4} maxLength={500} placeholder="簡單記錄客戶想製作的項目，可留空" /></label>
              {createCustomerError && <div className="create-customer-error" role="status">{createCustomerError}</div>}
              <div className="create-customer-actions"><button type="button" disabled={creatingCustomer} onClick={() => setCreateCustomerOpen(false)}>取消</button><button type="submit" disabled={creatingCustomer}>{creatingCustomer ? "新增中…" : "建立客戶"}</button></div>
            </form>
          </section>
        </div>
      )}

      {detailInquiry && (
        <div className="quick-detail-layer">
          <button className="quick-detail-backdrop" type="button" onClick={() => setDetailInquiryId(null)} aria-label="關閉需求內容" />
          <aside className="quick-detail-panel" role="dialog" aria-modal="true" aria-labelledby="quick-detail-title">
            <header className="quick-detail-header">
              <div><span>快速處理</span><strong>{detailInquiry.projectType}</strong></div>
              <button type="button" onClick={() => setDetailInquiryId(null)} aria-label="關閉需求內容">×</button>
            </header>
            <div className="quick-detail-scroll">
              <div className="quick-detail-identity">
                <span className="detail-avatar">{detailInquiry.client.slice(0, 1)}</span>
                <div><h2 id="quick-detail-title">{detailInquiry.client}</h2><p>{detailInquiry.company}</p></div>
                <ReplyStatusBadge status={detailInquiry.replyStatus} />
              </div>
              <div className="quick-detail-status">
                <span>案件進度</span>
                <strong className={`quick-stage-label status-${detailInquiry.status}`}>{statusLabels[detailInquiry.status]}</strong>
              </div>
              <form key={`${detailInquiry.id}-${detailInquiry.replyStatus}-${detailInquiry.nextFollowUpAt}-${detailInquiry.nextAction}`} className={`quick-workflow-form${quickWorkflowOpen ? " is-open" : ""}`} onSubmit={(event) => { void saveFollowUp(event, detailInquiry); }}>
                <div className="quick-workflow-heading"><div><span>下一步安排</span><strong>{getWorkflowAction(detailInquiry.nextAction)?.label || detailInquiry.nextAction || defaultWorkflowAction.label}</strong></div></div>
                <div className="quick-workflow-summary"><span>下次追蹤</span><strong>{formatTaipeiDateTime(detailInquiry.nextFollowUpAt || defaultFollowUpAt)}</strong>{quickWorkflowOpen && <button type="button" onClick={() => setQuickDateOpen((current) => !current)}>{quickDateOpen ? "使用自動日期" : "調整日期"}</button>}</div>
                <div className="quick-workflow-primary-actions">
                  <button type="button" disabled={updatingStatuses.has(detailInquiry.id)} onClick={() => { void markResponded(detailInquiry); }}>已回覆客戶</button>
                  <button type="button" aria-expanded={quickWorkflowOpen} aria-controls={`quick-workflow-editor-${detailInquiry.id}`} onClick={() => setQuickWorkflowOpen((current) => !current)}>{quickWorkflowOpen ? "收合安排" : "變更安排"}</button>
                </div>
                {quickWorkflowOpen && (
                  <div className="quick-workflow-editor" id={`quick-workflow-editor-${detailInquiry.id}`}>
                    {detailInquiry.nextAction && !getWorkflowAction(detailInquiry.nextAction) && <p className="legacy-workflow-action">原本事項：{detailInquiry.nextAction}</p>}
                    <fieldset className="workflow-action-picker">
                      <legend>選擇下一步</legend>
                      <div className="workflow-action-group">
                        <div className="workflow-action-options">
                          {quickWorkflowActions.map((action, index, actions) => (
                            <label className="workflow-action-option" htmlFor={`workflow-${detailInquiry.id}-${action.value}`} aria-label={action.label} key={action.value}>
                              <input id={`workflow-${detailInquiry.id}-${action.value}`} type="radio" name="nextAction" value={action.value} defaultChecked={actions.some((item) => item.value === detailInquiry.nextAction) ? detailInquiry.nextAction === action.value : index === 0} />
                              <span><strong>{action.label}</strong><small>{action.helper}</small></span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <small className="quick-workflow-auto-note">選擇後會自動更新案件進度與追蹤日期。</small>
                    </fieldset>
                    {quickDateOpen && (
                      <div className="quick-custom-follow-up">
                        <input type="hidden" name="followUpPreset" value="custom" />
                        <label className="custom-follow-up-date"><span>自訂追蹤時間</span><input name="customFollowUpAt" type="datetime-local" defaultValue={toDateTimeLocalValue(detailInquiry.nextFollowUpAt || defaultFollowUpAt)} /></label>
                      </div>
                    )}
                    <details className="quick-other-workflow-actions">
                      <summary>其他處理</summary>
                      <div className="workflow-action-options">
                        {otherWorkflowActions.map((action) => (
                          <label className="workflow-action-option" htmlFor={`workflow-other-${detailInquiry.id}-${action.value}`} aria-label={action.label} key={action.value}>
                            <input id={`workflow-other-${detailInquiry.id}-${action.value}`} type="radio" name="nextAction" value={action.value} />
                            <span><strong>{action.label}</strong><small>{action.helper}</small></span>
                          </label>
                        ))}
                      </div>
                    </details>
                    <div className="quick-workflow-actions">
                      <button type="button" onClick={() => { setQuickWorkflowOpen(false); setQuickDateOpen(false); }}>取消</button>
                      <button type="submit" disabled={updatingStatuses.has(detailInquiry.id)}>{updatingStatuses.has(detailInquiry.id) ? "儲存中…" : "套用安排"}</button>
                    </div>
                  </div>
                )}
              </form>
              <section className="quick-detail-section quick-contact-section">
                <h3>聯絡方式</h3>
                <button className={`quick-contact-copy${copiedContactId === detailInquiry.id ? " is-copied" : ""}`} type="button" onClick={() => copyContact(detailInquiry)} title="點擊複製聯絡方式"><span>{detailInquiry.contact}</span><small aria-live="polite">{copiedContactId === detailInquiry.id ? "已複製" : "點擊複製"}</small></button>
              </section>
              <section className="quick-detail-section">
                <h3>需求重點</h3>
                <div className="quick-detail-tags">{detailInquiry.services.slice(0, 2).map((service) => <span key={service}>{service}</span>)}{detailInquiry.services.length > 2 && <span>+{detailInquiry.services.length - 2}</span>}</div>
                <ul className="quick-detail-summary">{detailInquiry.summary.slice(0, 3).map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
                <div className={`quick-detail-estimate${detailInquiry.budget && detailInquiry.budget !== "未設定" ? " has-budget" : ""}`}><span><small>網站初估</small><strong>{detailInquiry.estimate}</strong></span>{detailInquiry.budget && detailInquiry.budget !== "未設定" && <span><small>客戶預算</small><strong>{detailInquiry.budget}</strong></span>}</div>
                {relatedInquiries.length > 0 && <p className="quick-detail-related">這位客戶另有 {relatedInquiries.length} 筆需求，可在完整內容查看。</p>}
                {detailInquiry.note && <p className="quick-detail-note-indicator"><strong>有內部備註</strong><span>請至完整內容查看</span></p>}
              </section>
            </div>
            <footer className="quick-detail-footer">
              <button type="button" disabled={detailInquiry.contact === "未填寫"} onClick={() => copyContact(detailInquiry)}>{copiedContactId === detailInquiry.id ? "已複製" : "複製聯絡方式"}</button>
              <a className="quick-detail-primary" href={`/admin/inquiries/${encodeURIComponent(detailInquiry.id)}`}>查看完整內容</a>
            </footer>
          </aside>
        </div>
      )}
    </main>
  );
}

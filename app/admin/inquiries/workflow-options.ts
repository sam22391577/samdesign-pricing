export type WorkflowReplyStatus = "needs_reply" | "waiting_client" | "client_replied" | "scheduled" | "paused" | "completed";

export type WorkflowAction = {
  value: string;
  label: string;
  helper: string;
  replyStatus: WorkflowReplyStatus;
};

export type WorkflowActionGroup = {
  label: string;
  actions: WorkflowAction[];
};

export const workflowActionGroups: WorkflowActionGroup[] = [
  {
    label: "需求與報價",
    actions: [
      { value: "聯絡客戶確認需求", label: "確認客戶需求", helper: "待我回覆", replyStatus: "needs_reply" },
      { value: "請客戶補充資料", label: "請客戶補資料", helper: "待我回覆", replyStatus: "needs_reply" },
      { value: "製作正式報價", label: "製作正式報價", helper: "安排處理", replyStatus: "scheduled" },
      { value: "寄送正式報價", label: "寄送正式報價", helper: "待我回覆", replyStatus: "needs_reply" },
    ],
  },
  {
    label: "合作與製作",
    actions: [
      { value: "等待客戶確認", label: "等待客戶確認", helper: "等待客戶", replyStatus: "waiting_client" },
      { value: "安排製作檔期", label: "安排製作檔期", helper: "安排處理", replyStatus: "scheduled" },
      { value: "寄送初稿或成品", label: "寄送初稿／成品", helper: "安排處理", replyStatus: "scheduled" },
      { value: "安排修改", label: "安排修改", helper: "安排處理", replyStatus: "scheduled" },
    ],
  },
  {
    label: "完成或暫停",
    actions: [
      { value: "完成並結案", label: "完成並結案", helper: "已完成", replyStatus: "completed" },
      { value: "暫緩追蹤", label: "暫緩追蹤", helper: "暫緩", replyStatus: "paused" },
    ],
  },
];

export const workflowActions = workflowActionGroups.flatMap((group) => group.actions);
export const defaultWorkflowAction = workflowActions[0];

export const followUpPresets = [
  { value: "0", label: "今天", days: 0 },
  { value: "3", label: "3 天後", days: 3 },
  { value: "5", label: "5 天後", days: 5 },
  { value: "7", label: "7 天後", days: 7 },
] as const;

export function getWorkflowAction(value: string) {
  return workflowActions.find((action) => action.value === value);
}

export function followUpAfterDays(days: number, now = new Date()) {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

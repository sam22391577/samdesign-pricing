export type WorkflowReplyStatus = "needs_reply" | "waiting_client" | "client_replied" | "scheduled" | "paused" | "completed";
export type WorkflowPhaseKey = "cooperation" | "scheduling" | "draft" | "revision" | "delivery";

export type WorkflowAction = {
  value: string;
  label: string;
  helper: string;
  replyStatus: WorkflowReplyStatus;
};

export type WorkflowPhase = {
  key: WorkflowPhaseKey;
  label: string;
  actions: WorkflowAction[];
};

export const quoteWorkflowActions: WorkflowAction[] = [
  { value: "聯絡客戶確認需求", label: "確認客戶需求", helper: "待我回覆", replyStatus: "needs_reply" },
  { value: "請客戶補充資料", label: "請客戶補資料", helper: "待我回覆", replyStatus: "needs_reply" },
  { value: "製作正式報價", label: "製作正式報價", helper: "安排處理", replyStatus: "scheduled" },
  { value: "寄送正式報價", label: "寄送正式報價", helper: "待我回覆", replyStatus: "needs_reply" },
];

export const productionWorkflowPhases: WorkflowPhase[] = [
  {
    key: "cooperation",
    label: "合作確認",
    actions: [
      { value: "等待客戶確認合作", label: "等待確認合作", helper: "等待客戶", replyStatus: "waiting_client" },
      { value: "等待訂金", label: "等待訂金", helper: "等待客戶", replyStatus: "waiting_client" },
      { value: "等待客戶提供素材", label: "等待客戶提供素材", helper: "等待客戶", replyStatus: "waiting_client" },
    ],
  },
  {
    key: "scheduling",
    label: "排程製作",
    actions: [
      { value: "安排製作檔期", label: "安排製作檔期", helper: "安排處理", replyStatus: "scheduled" },
      { value: "開始製作", label: "開始製作", helper: "安排處理", replyStatus: "scheduled" },
    ],
  },
  {
    key: "draft",
    label: "初稿回覆",
    actions: [
      { value: "寄送初稿", label: "寄送初稿", helper: "安排處理", replyStatus: "scheduled" },
      { value: "等待客戶回覆", label: "等待客戶回覆", helper: "等待客戶", replyStatus: "waiting_client" },
    ],
  },
  {
    key: "revision",
    label: "修改定稿",
    actions: [
      { value: "安排修改", label: "安排修改", helper: "安排處理", replyStatus: "scheduled" },
      { value: "寄送修改稿", label: "寄送修改稿", helper: "安排處理", replyStatus: "scheduled" },
      { value: "等待定稿確認", label: "等待定稿確認", helper: "等待客戶", replyStatus: "waiting_client" },
    ],
  },
  {
    key: "delivery",
    label: "成品交付",
    actions: [
      { value: "等待尾款", label: "等待尾款", helper: "等待客戶", replyStatus: "waiting_client" },
      { value: "交付成品", label: "交付成品", helper: "安排處理", replyStatus: "scheduled" },
    ],
  },
];

export const closingWorkflowActions: WorkflowAction[] = [
  { value: "完成並結案", label: "完成並結案", helper: "已完成", replyStatus: "completed" },
  { value: "暫緩追蹤", label: "暫緩追蹤", helper: "暫緩", replyStatus: "paused" },
];

export const workflowActions = [
  ...quoteWorkflowActions,
  ...productionWorkflowPhases.flatMap((phase) => phase.actions),
  ...closingWorkflowActions,
];
export const defaultWorkflowAction = workflowActions[0];

export const followUpPresets = [
  { value: "0", label: "今天", days: 0 },
  { value: "3", label: "3 天後", days: 3 },
  { value: "5", label: "5 天後", days: 5 },
  { value: "7", label: "7 天後", days: 7 },
] as const;

const responseFollowUpActionValues: Record<string, string> = {
  聯絡客戶確認需求: "等待客戶確認合作",
  請客戶補充資料: "等待客戶提供素材",
  寄送正式報價: "等待客戶確認合作",
  寄送初稿: "等待客戶回覆",
  寄送修改稿: "等待定稿確認",
  交付成品: "完成並結案",
};

export function getWorkflowAction(value: string) {
  return workflowActions.find((action) => action.value === value);
}

export function getWorkflowPhaseForAction(value: string) {
  return productionWorkflowPhases.find((phase) => phase.actions.some((action) => action.value === value));
}

export function getActionAfterResponse(value: string) {
  return getWorkflowAction(responseFollowUpActionValues[value] || "等待客戶確認合作") || defaultWorkflowAction;
}

export function followUpAfterDays(days: number, now = new Date()) {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

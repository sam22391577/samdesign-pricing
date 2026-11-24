export type WorkflowReplyStatus = "needs_reply" | "waiting_client" | "client_replied" | "scheduled" | "paused" | "completed";

export type CaseStage =
  | "new"
  | "negotiating"
  | "confirmed"
  | "production"
  | "delivery"
  | "completed"
  | "paused"
  | "lost"
  | "archived";

export type WorkflowAction = {
  value: string;
  label: string;
  helper: string;
  replyStatus: WorkflowReplyStatus;
  availableIn: CaseStage;
  caseStage: CaseStage;
  followUpDays: number | null;
};

export const caseStageLabels: Record<CaseStage, string> = {
  new: "新需求",
  negotiating: "報價洽談",
  confirmed: "合作確認",
  production: "製作中",
  delivery: "交付中",
  completed: "已完成",
  paused: "暫緩",
  lost: "未合作",
  archived: "已封存",
};

export const primaryCaseStages: CaseStage[] = ["new", "negotiating", "confirmed", "production", "delivery", "completed"];
export const secondaryCaseStages: CaseStage[] = ["paused", "lost", "archived"];
export const editableCaseStages: CaseStage[] = [...primaryCaseStages, ...secondaryCaseStages];

export const workflowActions: WorkflowAction[] = [
  { value: "聯絡客戶確認需求", label: "確認客戶需求", helper: "待我處理・3 天", replyStatus: "needs_reply", availableIn: "new", caseStage: "new", followUpDays: 3 },
  { value: "請客戶補充資料", label: "請客戶補資料", helper: "待我處理・3 天", replyStatus: "needs_reply", availableIn: "new", caseStage: "new", followUpDays: 3 },
  { value: "等待需求回覆", label: "等待需求回覆", helper: "等待客戶・5 天", replyStatus: "waiting_client", availableIn: "new", caseStage: "new", followUpDays: 5 },
  { value: "製作正式報價", label: "製作正式報價", helper: "進入報價・3 天", replyStatus: "scheduled", availableIn: "new", caseStage: "negotiating", followUpDays: 3 },

  { value: "寄送正式報價", label: "寄送正式報價", helper: "待我處理・3 天", replyStatus: "needs_reply", availableIn: "negotiating", caseStage: "negotiating", followUpDays: 3 },
  { value: "等待客戶確認合作", label: "等待客戶確認", helper: "等待客戶・5 天", replyStatus: "waiting_client", availableIn: "negotiating", caseStage: "negotiating", followUpDays: 5 },

  { value: "等待訂金", label: "等待訂金", helper: "等待客戶・5 天", replyStatus: "waiting_client", availableIn: "confirmed", caseStage: "confirmed", followUpDays: 5 },
  { value: "等待客戶提供素材", label: "等待客戶提供素材", helper: "等待客戶・5 天", replyStatus: "waiting_client", availableIn: "confirmed", caseStage: "confirmed", followUpDays: 5 },
  { value: "安排製作檔期", label: "安排製作檔期", helper: "進入製作・3 天", replyStatus: "scheduled", availableIn: "confirmed", caseStage: "production", followUpDays: 3 },

  { value: "開始製作", label: "開始製作", helper: "製作處理・3 天", replyStatus: "scheduled", availableIn: "production", caseStage: "production", followUpDays: 3 },
  { value: "寄送初稿", label: "寄送初稿", helper: "待我處理・3 天", replyStatus: "scheduled", availableIn: "production", caseStage: "production", followUpDays: 3 },
  { value: "等待客戶回覆", label: "等待初稿回覆", helper: "等待客戶・5 天", replyStatus: "waiting_client", availableIn: "production", caseStage: "production", followUpDays: 5 },
  { value: "安排修改", label: "安排修改", helper: "製作處理・3 天", replyStatus: "scheduled", availableIn: "production", caseStage: "production", followUpDays: 3 },
  { value: "寄送修改稿", label: "寄送修改稿", helper: "待我處理・3 天", replyStatus: "scheduled", availableIn: "production", caseStage: "production", followUpDays: 3 },
  { value: "等待定稿確認", label: "等待定稿確認", helper: "等待客戶・5 天", replyStatus: "waiting_client", availableIn: "production", caseStage: "production", followUpDays: 5 },

  { value: "等待尾款", label: "等待尾款", helper: "等待客戶・3 天", replyStatus: "waiting_client", availableIn: "delivery", caseStage: "delivery", followUpDays: 3 },
  { value: "交付成品", label: "交付成品", helper: "待我處理・3 天", replyStatus: "scheduled", availableIn: "delivery", caseStage: "delivery", followUpDays: 3 },
  { value: "等待交付確認", label: "等待交付確認", helper: "等待客戶・3 天", replyStatus: "waiting_client", availableIn: "delivery", caseStage: "delivery", followUpDays: 3 },

  { value: "完成並結案", label: "完成並結案", helper: "結案後不再追蹤", replyStatus: "completed", availableIn: "completed", caseStage: "completed", followUpDays: null },
  { value: "暫緩追蹤", label: "暫緩追蹤", helper: "14 天後再追蹤", replyStatus: "paused", availableIn: "paused", caseStage: "paused", followUpDays: 14 },
  { value: "未合作", label: "標記未合作", helper: "結束追蹤", replyStatus: "completed", availableIn: "lost", caseStage: "lost", followUpDays: null },
  { value: "封存案件", label: "封存案件", helper: "移至封存", replyStatus: "completed", availableIn: "archived", caseStage: "archived", followUpDays: null },
];

export const defaultWorkflowAction = workflowActions[0];

export const followUpPresets = [
  { value: "0", label: "今天", days: 0 },
  { value: "3", label: "3 天後", days: 3 },
  { value: "5", label: "5 天後", days: 5 },
  { value: "7", label: "7 天後", days: 7 },
] as const;

const responseFollowUpActionValues: Record<string, string> = {
  聯絡客戶確認需求: "等待需求回覆",
  請客戶補充資料: "等待需求回覆",
  等待需求回覆: "製作正式報價",
  寄送正式報價: "等待客戶確認合作",
  等待客戶確認合作: "等待訂金",
  等待訂金: "等待客戶提供素材",
  等待客戶提供素材: "安排製作檔期",
  寄送初稿: "等待客戶回覆",
  等待客戶回覆: "安排修改",
  寄送修改稿: "等待定稿確認",
  等待定稿確認: "等待尾款",
  交付成品: "等待交付確認",
  等待交付確認: "完成並結案",
};

const quickWorkflowActionValues: Record<CaseStage, string[]> = {
  new: ["聯絡客戶確認需求", "製作正式報價"],
  negotiating: ["寄送正式報價", "等待客戶確認合作"],
  confirmed: ["等待客戶提供素材", "安排製作檔期"],
  production: ["寄送初稿", "安排修改", "等待定稿確認"],
  delivery: ["等待尾款", "交付成品", "完成並結案"],
  completed: ["完成並結案"],
  paused: ["暫緩追蹤"],
  lost: ["未合作"],
  archived: ["封存案件"],
};

const exceptionalWorkflowActionValues = ["暫緩追蹤", "未合作", "封存案件"];

const legacyStageMap: Record<string, CaseStage> = {
  contacted: "negotiating",
  quoted: "negotiating",
  won: "confirmed",
};

export function getWorkflowAction(value: string) {
  return workflowActions.find((action) => action.value === value);
}

export function getWorkflowActionsForStage(stage: CaseStage) {
  return workflowActions.filter((action) => action.availableIn === stage);
}

export function getQuickWorkflowActionsForStage(stage: CaseStage, currentValue = "") {
  const recommended = quickWorkflowActionValues[stage]
    .map((value) => getWorkflowAction(value))
    .filter((action): action is WorkflowAction => Boolean(action));
  const currentAction = getWorkflowAction(currentValue);
  if (!currentAction || recommended.some((action) => action.value === currentAction.value)) return recommended;
  if (currentAction.availableIn !== stage && currentAction.caseStage !== stage) return recommended;
  return [currentAction, ...recommended].slice(0, 3);
}

export function getOtherWorkflowActionsForStage(stage: CaseStage, visibleActions: WorkflowAction[]) {
  const visibleValues = new Set(visibleActions.map((action) => action.value));
  const values = [
    ...getWorkflowActionsForStage(stage).map((action) => action.value),
    ...exceptionalWorkflowActionValues,
  ];
  return [...new Set(values)]
    .filter((value) => !visibleValues.has(value))
    .map((value) => getWorkflowAction(value))
    .filter((action): action is WorkflowAction => Boolean(action));
}

export function normalizeCaseStage(value: string, nextAction = ""): CaseStage {
  const legacyStage = legacyStageMap[value];
  if (legacyStage) return getWorkflowAction(nextAction)?.caseStage ?? legacyStage;
  return editableCaseStages.includes(value as CaseStage) ? value as CaseStage : "new";
}

export function getActionAfterResponse(value: string) {
  const currentAction = getWorkflowAction(value) ?? defaultWorkflowAction;
  return getWorkflowAction(responseFollowUpActionValues[value]) ?? currentAction;
}

export function getSuggestedFollowUpAt(action: WorkflowAction, now = new Date()) {
  return action.followUpDays === null ? "" : followUpAfterDays(action.followUpDays, now);
}

export function followUpAfterDays(days: number, now = new Date()) {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

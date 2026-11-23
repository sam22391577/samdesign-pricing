export const questionnaireStatuses = ["draft", "published", "closed"] as const;
export type QuestionnaireStatus = (typeof questionnaireStatuses)[number];

export const questionnaireQuestionTypes = [
  "short",
  "long",
  "single",
  "multiple",
  "dropdown",
  "date",
] as const;

export type QuestionnaireQuestionType = (typeof questionnaireQuestionTypes)[number];

export type QuestionnaireQuestion = {
  id: string;
  type: QuestionnaireQuestionType;
  label: string;
  helpText: string;
  required: boolean;
  options: string[];
};

export const questionnaireQuestionTypeLabels: Record<QuestionnaireQuestionType, string> = {
  short: "簡短文字",
  long: "長篇回答",
  single: "單選",
  multiple: "複選",
  dropdown: "下拉選單",
  date: "日期",
};

export const questionnaireStatusLabels: Record<QuestionnaireStatus, string> = {
  draft: "草稿",
  published: "收集中",
  closed: "已結束",
};

const questionTypeSet = new Set<string>(questionnaireQuestionTypes);

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function normalizeQuestionnaireQuestions(value: unknown): QuestionnaireQuestion[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 60).map((item, index) => {
    const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
    const type = questionTypeSet.has(String(row.type)) ? row.type as QuestionnaireQuestionType : "short";
    const rawOptions = Array.isArray(row.options) ? row.options : [];
    const options = rawOptions
      .filter((option): option is string => typeof option === "string")
      .map((option) => option.trim().slice(0, 120))
      .filter(Boolean)
      .slice(0, 30);
    return {
      id: cleanText(row.id, 80) || `question-${index + 1}`,
      type,
      label: cleanText(row.label, 240) || `問題 ${index + 1}`,
      helpText: cleanText(row.helpText, 400),
      required: Boolean(row.required),
      options: ["single", "multiple", "dropdown"].includes(type) ? options : [],
    };
  });
}

export function parseQuestionnaireQuestions(value: string) {
  try {
    return normalizeQuestionnaireQuestions(JSON.parse(value));
  } catch {
    return [];
  }
}

export function createQuestion(type: QuestionnaireQuestionType = "short"): QuestionnaireQuestion {
  const choiceType = ["single", "multiple", "dropdown"].includes(type);
  return {
    id: crypto.randomUUID(),
    type,
    label: "未命名問題",
    helpText: "",
    required: false,
    options: choiceType ? ["選項 1", "選項 2"] : [],
  };
}

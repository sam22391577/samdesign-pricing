import { getD1 } from "../../../../../db";
import { parseQuestionnaireQuestions } from "../../../../questionnaire-types";

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanAnswer(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string").map((item) => item.trim().slice(0, 600)).filter(Boolean).slice(0, 30);
  }
  return cleanText(value, 4000);
}

function hasAnswer(value: string | string[]) {
  return Array.isArray(value) ? value.length > 0 : value.length > 0;
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const payload = await request.json() as {
      respondentName?: string;
      respondentContact?: string;
      answers?: Record<string, unknown>;
      website?: string;
    };
    if (payload.website) return Response.json({ ok: true }, { status: 201 });
    const questionnaire = await getD1().prepare(`SELECT id, questions_json AS questionsJson, status FROM questionnaires WHERE slug = ?`).bind(slug).first<{ id: string; questionsJson: string; status: string }>();
    if (!questionnaire || questionnaire.status !== "published") {
      return Response.json({ error: "這份問卷目前沒有開放填寫。" }, { status: 404 });
    }
    const respondentName = cleanText(payload.respondentName, 100);
    const respondentContact = cleanText(payload.respondentContact, 200);
    if (!respondentName || !respondentContact) return Response.json({ error: "請填寫姓名與聯絡方式。" }, { status: 400 });
    const questions = parseQuestionnaireQuestions(questionnaire.questionsJson);
    const answers = Object.fromEntries(questions.map((question) => [question.id, cleanAnswer(payload.answers?.[question.id])]));
    const missingQuestion = questions.find((question) => question.required && !hasAnswer(answers[question.id]));
    if (missingQuestion) return Response.json({ error: `請回答「${missingQuestion.label}」。` }, { status: 400 });
    const id = `QR-${crypto.randomUUID().slice(0, 10).toUpperCase()}`;
    const submittedAt = new Date().toISOString();
    await getD1().prepare(`INSERT INTO questionnaire_responses (
      id, questionnaire_id, submitted_at, respondent_name, respondent_contact,
      answers_json, status, note
    ) VALUES (?, ?, ?, ?, ?, ?, 'new', '')`)
      .bind(id, questionnaire.id, submittedAt, respondentName, respondentContact, JSON.stringify(answers)).run();
    return Response.json({ response: { id, submittedAt } }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "送出問卷失敗。" }, { status: 500 });
  }
}

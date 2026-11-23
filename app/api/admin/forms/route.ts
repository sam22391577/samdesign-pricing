import { getD1 } from "../../../../db";
import { createQuestion } from "../../../questionnaire-types";
import { canManageInquiries, unauthorizedResponse } from "../../inquiries/access";

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function formatQuestionnaireId() {
  return `QF-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

function formatSlug() {
  return `form-${crypto.randomUUID().slice(0, 10).toLowerCase()}`;
}

const questionnaireListSql = `SELECT
  q.id,
  q.slug,
  q.title,
  q.description,
  q.status,
  q.questions_json AS questionsJson,
  q.thank_you_message AS thankYouMessage,
  q.created_at AS createdAt,
  q.updated_at AS updatedAt,
  q.published_at AS publishedAt,
  COUNT(r.id) AS responseCount
  FROM questionnaires q
  LEFT JOIN questionnaire_responses r ON r.questionnaire_id = q.id
  GROUP BY q.id
  ORDER BY q.updated_at DESC`;

export async function GET() {
  if (!(await canManageInquiries())) return unauthorizedResponse();
  try {
    const result = await getD1().prepare(questionnaireListSql).all();
    return Response.json({ questionnaires: result.results });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "無法讀取問卷。" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await canManageInquiries())) return unauthorizedResponse();
  try {
    const payload = await request.json().catch(() => ({})) as { title?: string; description?: string };
    const id = formatQuestionnaireId();
    const slug = formatSlug();
    const title = cleanText(payload.title, 160) || "未命名問卷";
    const description = cleanText(payload.description, 1200);
    const questions = [
      { ...createQuestion("short"), label: "請問您希望我們協助什麼？", required: true },
      { ...createQuestion("long"), label: "請簡單說明您的需求", helpText: "可包含目標、預算或希望完成的時間。", required: true },
    ];
    const now = new Date().toISOString();
    await getD1().prepare(`INSERT INTO questionnaires (
      id, slug, title, description, status, questions_json, thank_you_message,
      created_at, updated_at, published_at
    ) VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, NULL)`)
      .bind(
        id,
        slug,
        title,
        description,
        JSON.stringify(questions),
        "感謝您的填寫，我們會儘快與您聯絡。",
        now,
        now,
      ).run();
    return Response.json({ questionnaire: {
      id,
      slug,
      title,
      description,
      status: "draft",
      questionsJson: JSON.stringify(questions),
      thankYouMessage: "感謝您的填寫，我們會儘快與您聯絡。",
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
      responseCount: 0,
    } }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "建立問卷失敗。" }, { status: 500 });
  }
}

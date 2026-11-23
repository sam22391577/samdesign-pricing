import { getD1 } from "../../../../../db";
import { normalizeQuestionnaireQuestions, questionnaireStatuses } from "../../../../questionnaire-types";
import { canManageInquiries, unauthorizedResponse } from "../../../inquiries/access";

const allowedStatuses = new Set<string>(questionnaireStatuses);

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await canManageInquiries())) return unauthorizedResponse();
  try {
    const { id } = await context.params;
    const payload = await request.json() as {
      title?: string;
      description?: string;
      status?: string;
      questions?: unknown;
      thankYouMessage?: string;
    };
    const current = await getD1().prepare("SELECT status FROM questionnaires WHERE id = ?").bind(id).first<{ status: string }>();
    if (!current) return Response.json({ error: "找不到這份問卷。" }, { status: 404 });

    const updates: string[] = [];
    const values: unknown[] = [];
    if (payload.title !== undefined) {
      const title = cleanText(payload.title, 160);
      if (!title) return Response.json({ error: "請填寫問卷名稱。" }, { status: 400 });
      updates.push("title = ?");
      values.push(title);
    }
    if (payload.description !== undefined) {
      updates.push("description = ?");
      values.push(cleanText(payload.description, 1200));
    }
    if (payload.questions !== undefined) {
      const questions = normalizeQuestionnaireQuestions(payload.questions);
      if (questions.length === 0) return Response.json({ error: "問卷至少需要一個問題。" }, { status: 400 });
      updates.push("questions_json = ?");
      values.push(JSON.stringify(questions));
    }
    if (payload.thankYouMessage !== undefined) {
      updates.push("thank_you_message = ?");
      values.push(cleanText(payload.thankYouMessage, 600) || "感謝您的填寫，我們會儘快與您聯絡。");
    }
    if (payload.status !== undefined) {
      if (!allowedStatuses.has(payload.status)) return Response.json({ error: "無效的問卷狀態。" }, { status: 400 });
      updates.push("status = ?");
      values.push(payload.status);
      if (payload.status === "published" && current.status !== "published") {
        updates.push("published_at = ?");
        values.push(new Date().toISOString());
      }
    }
    if (updates.length === 0) return Response.json({ error: "沒有可更新的內容。" }, { status: 400 });
    const updatedAt = new Date().toISOString();
    updates.push("updated_at = ?");
    values.push(updatedAt, id);
    await getD1().prepare(`UPDATE questionnaires SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();
    return Response.json({ ok: true, updatedAt });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "儲存問卷失敗。" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await canManageInquiries())) return unauthorizedResponse();
  try {
    const { id } = await context.params;
    const result = await getD1().prepare("DELETE FROM questionnaires WHERE id = ?").bind(id).run();
    if (!result.meta.changes) return Response.json({ error: "找不到這份問卷。" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "刪除問卷失敗。" }, { status: 500 });
  }
}

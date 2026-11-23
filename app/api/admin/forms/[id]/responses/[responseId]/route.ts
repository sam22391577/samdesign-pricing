import { getD1 } from "../../../../../../../db";
import { canManageInquiries, unauthorizedResponse } from "../../../../../inquiries/access";

const allowedStatuses = new Set(["new", "reviewed", "completed"]);

export async function PATCH(request: Request, context: { params: Promise<{ id: string; responseId: string }> }) {
  if (!(await canManageInquiries())) return unauthorizedResponse();
  try {
    const { id, responseId } = await context.params;
    const payload = await request.json() as { status?: string; note?: string };
    const updates: string[] = [];
    const values: unknown[] = [];
    if (payload.status !== undefined) {
      if (!allowedStatuses.has(payload.status)) return Response.json({ error: "無效的回覆狀態。" }, { status: 400 });
      updates.push("status = ?");
      values.push(payload.status);
    }
    if (payload.note !== undefined) {
      updates.push("note = ?");
      values.push(payload.note.trim().slice(0, 4000));
    }
    if (updates.length === 0) return Response.json({ error: "沒有可更新的內容。" }, { status: 400 });
    values.push(responseId, id);
    const result = await getD1().prepare(`UPDATE questionnaire_responses SET ${updates.join(", ")} WHERE id = ? AND questionnaire_id = ?`).bind(...values).run();
    if (!result.meta.changes) return Response.json({ error: "找不到這筆回覆。" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "更新回覆失敗。" }, { status: 500 });
  }
}

import { ensureInquirySchema, getD1 } from "../../../../db";
import { canManageInquiries, unauthorizedResponse } from "../access";

const allowedStatuses = new Set(["new", "contacted", "quoted", "won", "archived"]);
const allowedPriorities = new Set(["high", "normal", "low"]);

const inquirySelectSql = `SELECT
  id,
  submitted_at AS submittedAt,
  updated_at AS updatedAt,
  client_name AS clientName,
  company,
  email,
  contact,
  project_type AS projectType,
  services_json AS servicesJson,
  estimate_low AS estimateLow,
  estimate_high AS estimateHigh,
  budget,
  summary_json AS summaryJson,
  answers_json AS answersJson,
  status,
  priority,
  assignee,
  note
  FROM inquiries
  WHERE id = ?`;

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await canManageInquiries())) return unauthorizedResponse();

  try {
    const { id } = await context.params;
    await ensureInquirySchema();
    const inquiry = await getD1().prepare(inquirySelectSql).bind(id).first();
    if (!inquiry) return Response.json({ error: "找不到這筆回覆。" }, { status: 404 });
    return Response.json({ inquiry });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "無法讀取這筆回覆。" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await canManageInquiries())) return unauthorizedResponse();

  try {
    const { id } = await context.params;
    const payload = (await request.json()) as { status?: string; priority?: string; assignee?: string; note?: string };
    const updates: string[] = [];
    const values: unknown[] = [];

    if (payload.status !== undefined) {
      if (!allowedStatuses.has(payload.status)) return Response.json({ error: "無效的處理狀態。" }, { status: 400 });
      updates.push("status = ?");
      values.push(payload.status);
    }
    if (payload.priority !== undefined) {
      if (!allowedPriorities.has(payload.priority)) return Response.json({ error: "無效的優先層級。" }, { status: 400 });
      updates.push("priority = ?");
      values.push(payload.priority);
    }
    if (payload.assignee !== undefined) {
      updates.push("assignee = ?");
      values.push(payload.assignee.trim().slice(0, 80));
    }
    if (payload.note !== undefined) {
      updates.push("note = ?");
      values.push(payload.note.trim().slice(0, 4000));
    }
    if (updates.length === 0) return Response.json({ error: "沒有可更新的欄位。" }, { status: 400 });

    updates.push("updated_at = ?");
    values.push(new Date().toISOString(), id);
    await ensureInquirySchema();
    const result = await getD1().prepare(`UPDATE inquiries SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();
    if (!result.meta.changes) return Response.json({ error: "找不到這筆回覆。" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "更新失敗。" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await canManageInquiries())) return unauthorizedResponse();

  try {
    const { id } = await context.params;
    await ensureInquirySchema();
    const result = await getD1().prepare("DELETE FROM inquiries WHERE id = ?").bind(id).run();
    if (!result.meta.changes) return Response.json({ error: "找不到這筆回覆。" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "刪除失敗。" }, { status: 500 });
  }
}

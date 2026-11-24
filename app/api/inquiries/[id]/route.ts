import { ensureInquirySchema, getD1 } from "../../../../db";
import { canManageInquiries, unauthorizedResponse } from "../access";

const allowedStatuses = new Set([
  "new",
  "negotiating",
  "confirmed",
  "production",
  "delivery",
  "completed",
  "paused",
  "lost",
  "archived",
  // Keep accepting legacy values while older records are being opened and normalized.
  "contacted",
  "quoted",
  "won",
]);
const allowedReplyStatuses = new Set(["needs_reply", "waiting_client", "client_replied", "scheduled", "paused", "completed"]);
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
  reply_status AS replyStatus,
  priority,
  assignee,
  last_contact_at AS lastContactAt,
  next_follow_up_at AS nextFollowUpAt,
  next_action AS nextAction,
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
    const payload = (await request.json()) as {
      status?: string;
      replyStatus?: string;
      priority?: string;
      assignee?: string;
      lastContactAt?: string | null;
      nextFollowUpAt?: string | null;
      nextAction?: string;
      note?: string;
    };
    const updates: string[] = [];
    const values: unknown[] = [];

    if (payload.status !== undefined) {
      if (!allowedStatuses.has(payload.status)) return Response.json({ error: "無效的處理狀態。" }, { status: 400 });
      updates.push("status = ?");
      values.push(payload.status);
    }
    if (payload.replyStatus !== undefined) {
      if (!allowedReplyStatuses.has(payload.replyStatus)) return Response.json({ error: "無效的回覆狀態。" }, { status: 400 });
      updates.push("reply_status = ?");
      values.push(payload.replyStatus);
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
    if (payload.lastContactAt !== undefined) {
      const lastContactAt = payload.lastContactAt ? new Date(payload.lastContactAt) : null;
      if (lastContactAt && Number.isNaN(lastContactAt.getTime())) return Response.json({ error: "最後聯絡時間格式不正確。" }, { status: 400 });
      updates.push("last_contact_at = ?");
      values.push(lastContactAt?.toISOString() ?? null);
    }
    if (payload.nextFollowUpAt !== undefined) {
      const nextFollowUpAt = payload.nextFollowUpAt ? new Date(payload.nextFollowUpAt) : null;
      if (nextFollowUpAt && Number.isNaN(nextFollowUpAt.getTime())) return Response.json({ error: "下次追蹤時間格式不正確。" }, { status: 400 });
      updates.push("next_follow_up_at = ?");
      values.push(nextFollowUpAt?.toISOString() ?? null);
    }
    if (payload.nextAction !== undefined) {
      updates.push("next_action = ?");
      values.push(payload.nextAction.trim().slice(0, 180));
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

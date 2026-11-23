import { ensureInquirySchema, getD1 } from "../../../db";
import { canManageInquiries, unauthorizedResponse } from "./access";

type NewInquiryPayload = {
  clientName?: string;
  company?: string;
  email?: string;
  contact?: string;
  projectType?: string;
  services?: unknown;
  estimateLow?: number;
  estimateHigh?: number;
  budget?: number;
  summary?: unknown;
  answers?: unknown;
  website?: string;
};

const publicFormOrigins = new Set([
  "https://sam22391577.github.io",
]);

function publicFormCorsHeaders(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || !publicFormOrigins.has(origin)) return new Headers();
  return new Headers({
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    "vary": "Origin",
  });
}

function publicFormJson(request: Request, data: unknown, init?: ResponseInit) {
  const response = Response.json(data, init);
  publicFormCorsHeaders(request).forEach((value, key) => response.headers.set(key, value));
  return response;
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanStringArray(value: unknown, limit = 40) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string").slice(0, limit).map((item) => item.slice(0, 500));
}

function formatInquiryId() {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()).replaceAll("-", "");
  return `SQ-${date}-${crypto.randomUUID().slice(0, 5).toUpperCase()}`;
}

export async function GET() {
  if (!(await canManageInquiries())) return unauthorizedResponse();
  try {
    await ensureInquirySchema();
    const result = await getD1().prepare(`SELECT
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
      status,
      reply_status AS replyStatus,
      priority,
      assignee,
      last_contact_at AS lastContactAt,
      next_follow_up_at AS nextFollowUpAt,
      next_action AS nextAction,
      note
      FROM inquiries
      ORDER BY submitted_at DESC
      LIMIT 250`).all();
    return Response.json({ inquiries: result.results });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "無法讀取問卷回覆。" }, { status: 500 });
  }
}

export async function OPTIONS(request: Request) {
  const headers = publicFormCorsHeaders(request);
  if (!headers.has("access-control-allow-origin")) {
    return new Response(null, { status: 403 });
  }
  return new Response(null, { status: 204, headers });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as NewInquiryPayload;
    if (payload.website) return publicFormJson(request, { ok: true }, { status: 201 });

    const clientName = cleanText(payload.clientName, 80);
    const company = cleanText(payload.company, 120);
    const email = cleanText(payload.email, 180).toLowerCase();
    const contact = cleanText(payload.contact, 180);
    const projectType = cleanText(payload.projectType, 40);
    const services = cleanStringArray(payload.services, 20);
    const summary = cleanStringArray(payload.summary, 80);
    const estimateLow = Number.isFinite(payload.estimateLow) ? Math.max(0, Math.round(payload.estimateLow ?? 0)) : 0;
    const estimateHigh = Number.isFinite(payload.estimateHigh) ? Math.max(0, Math.round(payload.estimateHigh ?? 0)) : 0;
    const budget = Number.isFinite(payload.budget) ? Math.max(0, Math.round(payload.budget ?? 0)) : null;

    if (!clientName || !contact || !projectType || services.length === 0) {
      return publicFormJson(request, { error: "請填寫姓名與聯絡方式，並完成需求試算。" }, { status: 400 });
    }

    const id = formatInquiryId();
    const submittedAt = new Date().toISOString();
    await ensureInquirySchema();
    await getD1().prepare(`INSERT INTO inquiries (
      id, submitted_at, updated_at, client_name, company, email, contact,
      project_type, services_json, estimate_low, estimate_high, budget,
      summary_json, answers_json, status, priority, assignee, note
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', 'normal', 'Sam', '')`)
      .bind(
        id,
        submittedAt,
        submittedAt,
        clientName,
        company,
        email,
        contact,
        projectType,
        JSON.stringify(services),
        estimateLow,
        estimateHigh,
        budget,
        JSON.stringify(summary),
        JSON.stringify(payload.answers ?? {}),
      ).run();

    return publicFormJson(request, { inquiry: { id, submittedAt } }, { status: 201 });
  } catch (error) {
    return publicFormJson(request, { error: error instanceof Error ? error.message : "送出失敗，請稍後再試。" }, { status: 500 });
  }
}

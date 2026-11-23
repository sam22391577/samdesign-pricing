import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(env.DB, { schema });
}

export function getD1() {
  if (!env.DB) {
    throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  }
  return env.DB;
}

export async function ensureInquirySchema() {
  const d1 = getD1();
  await d1.prepare(`CREATE TABLE IF NOT EXISTS inquiries (
      id TEXT PRIMARY KEY NOT NULL,
      submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      client_name TEXT NOT NULL,
      company TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL,
      contact TEXT NOT NULL DEFAULT '',
      project_type TEXT NOT NULL,
      services_json TEXT NOT NULL DEFAULT '[]',
      estimate_low INTEGER NOT NULL DEFAULT 0,
      estimate_high INTEGER NOT NULL DEFAULT 0,
      budget INTEGER,
      summary_json TEXT NOT NULL DEFAULT '[]',
      answers_json TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'new',
      reply_status TEXT NOT NULL DEFAULT 'needs_reply',
      priority TEXT NOT NULL DEFAULT 'normal',
      assignee TEXT NOT NULL DEFAULT 'Sam',
      last_contact_at TEXT,
      next_follow_up_at TEXT,
      next_action TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT ''
    )`).run();

  const columnResult = await d1.prepare("PRAGMA table_info(inquiries)").all();
  const columnNames = new Set(columnResult.results.map((column) => String((column as { name?: unknown }).name ?? "")));
  const missingColumns = [
    ["reply_status", "ALTER TABLE inquiries ADD COLUMN reply_status TEXT NOT NULL DEFAULT 'needs_reply'"],
    ["last_contact_at", "ALTER TABLE inquiries ADD COLUMN last_contact_at TEXT"],
    ["next_follow_up_at", "ALTER TABLE inquiries ADD COLUMN next_follow_up_at TEXT"],
    ["next_action", "ALTER TABLE inquiries ADD COLUMN next_action TEXT NOT NULL DEFAULT ''"],
  ] as const;

  for (const [columnName, statement] of missingColumns) {
    if (columnNames.has(columnName)) continue;
    try {
      await d1.prepare(statement).run();
    } catch (error) {
      if (!String(error).toLowerCase().includes("duplicate column")) throw error;
    }
  }

  await d1.batch([
    d1.prepare("CREATE INDEX IF NOT EXISTS idx_inquiries_submitted_at ON inquiries (submitted_at)"),
    d1.prepare("CREATE INDEX IF NOT EXISTS idx_inquiries_status_submitted_at ON inquiries (status, submitted_at)"),
    d1.prepare("CREATE INDEX IF NOT EXISTS idx_inquiries_reply_follow_up ON inquiries (reply_status, next_follow_up_at)"),
  ]);
}

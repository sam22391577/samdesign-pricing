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
  await d1.batch([
    d1.prepare(`CREATE TABLE IF NOT EXISTS inquiries (
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
      priority TEXT NOT NULL DEFAULT 'normal',
      assignee TEXT NOT NULL DEFAULT 'Sam',
      note TEXT NOT NULL DEFAULT ''
    )`),
    d1.prepare("CREATE INDEX IF NOT EXISTS idx_inquiries_submitted_at ON inquiries (submitted_at)"),
    d1.prepare("CREATE INDEX IF NOT EXISTS idx_inquiries_status_submitted_at ON inquiries (status, submitted_at)"),
  ]);
}

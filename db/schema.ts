import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const inquiries = sqliteTable("inquiries", {
  id: text("id").primaryKey(),
  submittedAt: text("submitted_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  clientName: text("client_name").notNull(),
  company: text("company").notNull().default(""),
  email: text("email").notNull(),
  contact: text("contact").notNull().default(""),
  projectType: text("project_type").notNull(),
  servicesJson: text("services_json").notNull().default("[]"),
  estimateLow: integer("estimate_low").notNull().default(0),
  estimateHigh: integer("estimate_high").notNull().default(0),
  budget: integer("budget"),
  summaryJson: text("summary_json").notNull().default("[]"),
  answersJson: text("answers_json").notNull().default("{}"),
  status: text("status").notNull().default("new"),
  priority: text("priority").notNull().default("normal"),
  assignee: text("assignee").notNull().default("Sam"),
  note: text("note").notNull().default(""),
}, (table) => [
  index("idx_inquiries_submitted_at").on(table.submittedAt),
  index("idx_inquiries_status_submitted_at").on(table.status, table.submittedAt),
]);

import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

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

export const questionnaires = sqliteTable("questionnaires", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  status: text("status").notNull().default("draft"),
  questionsJson: text("questions_json").notNull().default("[]"),
  thankYouMessage: text("thank_you_message").notNull().default("感謝您的填寫，我們會儘快與您聯絡。"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  publishedAt: text("published_at"),
}, (table) => [
  uniqueIndex("idx_questionnaires_slug").on(table.slug),
  index("idx_questionnaires_status_updated_at").on(table.status, table.updatedAt),
]);

export const questionnaireResponses = sqliteTable("questionnaire_responses", {
  id: text("id").primaryKey(),
  questionnaireId: text("questionnaire_id").notNull().references(() => questionnaires.id, { onDelete: "cascade" }),
  submittedAt: text("submitted_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  respondentName: text("respondent_name").notNull().default(""),
  respondentContact: text("respondent_contact").notNull().default(""),
  answersJson: text("answers_json").notNull().default("{}"),
  status: text("status").notNull().default("new"),
  note: text("note").notNull().default(""),
}, (table) => [
  index("idx_questionnaire_responses_form_submitted_at").on(table.questionnaireId, table.submittedAt),
  index("idx_questionnaire_responses_status_submitted_at").on(table.status, table.submittedAt),
]);

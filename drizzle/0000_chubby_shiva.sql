CREATE TABLE `inquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`submitted_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`client_name` text NOT NULL,
	`company` text DEFAULT '' NOT NULL,
	`email` text NOT NULL,
	`contact` text DEFAULT '' NOT NULL,
	`project_type` text NOT NULL,
	`services_json` text DEFAULT '[]' NOT NULL,
	`estimate_low` integer DEFAULT 0 NOT NULL,
	`estimate_high` integer DEFAULT 0 NOT NULL,
	`budget` integer,
	`summary_json` text DEFAULT '[]' NOT NULL,
	`answers_json` text DEFAULT '{}' NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`priority` text DEFAULT 'normal' NOT NULL,
	`assignee` text DEFAULT 'Sam' NOT NULL,
	`note` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_inquiries_submitted_at` ON `inquiries` (`submitted_at`);--> statement-breakpoint
CREATE INDEX `idx_inquiries_status_submitted_at` ON `inquiries` (`status`,`submitted_at`);
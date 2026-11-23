CREATE TABLE `questionnaires` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`questions_json` text DEFAULT '[]' NOT NULL,
	`thank_you_message` text DEFAULT '感謝您的填寫，我們會儘快與您聯絡。' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`published_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_questionnaires_slug` ON `questionnaires` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_questionnaires_status_updated_at` ON `questionnaires` (`status`,`updated_at`);--> statement-breakpoint
CREATE TABLE `questionnaire_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`questionnaire_id` text NOT NULL,
	`submitted_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`respondent_name` text DEFAULT '' NOT NULL,
	`respondent_contact` text DEFAULT '' NOT NULL,
	`answers_json` text DEFAULT '{}' NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`questionnaire_id`) REFERENCES `questionnaires`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_questionnaire_responses_form_submitted_at` ON `questionnaire_responses` (`questionnaire_id`,`submitted_at`);--> statement-breakpoint
CREATE INDEX `idx_questionnaire_responses_status_submitted_at` ON `questionnaire_responses` (`status`,`submitted_at`);

ALTER TABLE `inquiries` ADD `reply_status` text DEFAULT 'needs_reply' NOT NULL;
--> statement-breakpoint
ALTER TABLE `inquiries` ADD `last_contact_at` text;
--> statement-breakpoint
ALTER TABLE `inquiries` ADD `next_follow_up_at` text;
--> statement-breakpoint
ALTER TABLE `inquiries` ADD `next_action` text DEFAULT '' NOT NULL;
--> statement-breakpoint
CREATE INDEX `idx_inquiries_reply_follow_up` ON `inquiries` (`reply_status`,`next_follow_up_at`);

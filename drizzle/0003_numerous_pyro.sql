ALTER TABLE `app_users` ADD `password_hash` text;--> statement-breakpoint
ALTER TABLE `app_users` ADD `password_version` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `app_users` ADD `failed_login_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `app_users` ADD `locked_until` text;--> statement-breakpoint
ALTER TABLE `manual_evaluations` ADD `results_json` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `manual_evaluations` ADD `scoring_version` text;--> statement-breakpoint
ALTER TABLE `manual_evaluations` ADD `scored_at` text;
ALTER TABLE `app_users` ADD `must_change_password` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `app_users` ADD `temporary_password_version` text;
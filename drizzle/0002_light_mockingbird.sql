CREATE TABLE `application_profiles` (
	`campaign_id` text PRIMARY KEY NOT NULL,
	`internal_code` text NOT NULL,
	`cutoff_date` text NOT NULL,
	`technical_responsible` text NOT NULL,
	`battery_version` text DEFAULT 'V3' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `manual_evaluations` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`participant_code` text NOT NULL,
	`role_level` text NOT NULL,
	`instrument_form` text NOT NULL,
	`evaluator_email` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`sociodemographic_json` text DEFAULT '{}' NOT NULL,
	`intralaboral_answers_json` text DEFAULT '{}' NOT NULL,
	`extralaboral_answers_json` text DEFAULT '{}' NOT NULL,
	`stress_answers_json` text DEFAULT '{}' NOT NULL,
	`serves_customers` integer,
	`supervises_people` integer NOT NULL,
	`consent_verified` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `manual_evaluations_application_code_uq` ON `manual_evaluations` (`campaign_id`,`participant_code`);--> statement-breakpoint
CREATE INDEX `manual_evaluations_application_idx` ON `manual_evaluations` (`campaign_id`);--> statement-breakpoint
CREATE INDEX `manual_evaluations_updated_idx` ON `manual_evaluations` (`updated_at`);
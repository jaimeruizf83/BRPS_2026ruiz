CREATE TABLE `batch_answers` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`item_number` integer NOT NULL,
	`selected_value` integer,
	`reviewed_value` integer,
	`confidence` real DEFAULT 0 NOT NULL,
	`multiple_marks` integer DEFAULT false NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`document_id`) REFERENCES `batch_documents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `batch_answers_document_item_uq` ON `batch_answers` (`document_id`,`item_number`);--> statement-breakpoint
CREATE INDEX `batch_answers_document_idx` ON `batch_answers` (`document_id`);--> statement-breakpoint
CREATE TABLE `batch_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`batch_id` text NOT NULL,
	`original_name` text NOT NULL,
	`source_type` text NOT NULL,
	`source_reference` text,
	`r2_key` text,
	`byte_size` integer NOT NULL,
	`file_sha256` text NOT NULL,
	`mime_type` text DEFAULT 'application/pdf' NOT NULL,
	`status` text DEFAULT 'uploaded' NOT NULL,
	`detected_form` text,
	`participant_code` text,
	`role_level` text,
	`document_confidence` real,
	`warnings_json` text DEFAULT '[]' NOT NULL,
	`extraction_model` text,
	`error_message` text,
	`imported_submission_id` text,
	`reviewed_by` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`processed_at` text,
	`reviewed_at` text,
	`confirmed_at` text,
	`original_deleted_at` text,
	FOREIGN KEY (`batch_id`) REFERENCES `scoring_batches`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`imported_submission_id`) REFERENCES `submissions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `batch_documents_batch_idx` ON `batch_documents` (`batch_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `batch_documents_batch_sha_uq` ON `batch_documents` (`batch_id`,`file_sha256`);--> statement-breakpoint
CREATE TABLE `scoring_batches` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`name` text NOT NULL,
	`requested_form` text DEFAULT 'auto' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`delete_originals_after_confirmation` integer DEFAULT true NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `scoring_batches_campaign_idx` ON `scoring_batches` (`campaign_id`);--> statement-breakpoint
CREATE INDEX `scoring_batches_created_idx` ON `scoring_batches` (`created_at`);
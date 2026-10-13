CREATE TABLE `ai_cache` (
	`key` text PRIMARY KEY,
	`endpoint` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `learning_progress` (
	`id` text PRIMARY KEY,
	`user_id` text DEFAULT 'anon' NOT NULL,
	`material_id` text NOT NULL,
	`last_score` integer,
	`last_read_at` integer,
	`updated_at` integer NOT NULL
);

DROP TABLE `learning_progress`;
--> statement-breakpoint
CREATE TABLE `learning_progress` (
	`id` text PRIMARY KEY,
	`user_id` text DEFAULT 'anon' NOT NULL,
	`material_id` text NOT NULL,
	`best_score` integer,
	`quiz_count` integer DEFAULT 0 NOT NULL,
	`last_activity_at` text NOT NULL,
	`updated_at` integer NOT NULL
);

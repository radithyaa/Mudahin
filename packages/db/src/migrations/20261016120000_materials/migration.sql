CREATE TABLE `materials` (
	`id` text PRIMARY KEY,
	`user_id` text DEFAULT 'anon' NOT NULL,
	`title` text NOT NULL,
	`subject` text NOT NULL,
	`grade_level` text NOT NULL,
	`summary` text NOT NULL,
	`reading_minutes` integer DEFAULT 3 NOT NULL,
	`paragraphs` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `materials_userId_idx` ON `materials` (`user_id`);

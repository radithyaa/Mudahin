CREATE TABLE `voice_attempts` (
	`id` text PRIMARY KEY,
	`user_id` text DEFAULT 'anon' NOT NULL,
	`material_id` text NOT NULL,
	`material_title` text NOT NULL,
	`question` text NOT NULL,
	`transcript` text NOT NULL,
	`correct` integer NOT NULL,
	`feedback` text NOT NULL,
	`replay` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `voice_attempts_userId_idx` ON `voice_attempts` (`user_id`, `created_at`);
--> statement-breakpoint
CREATE TABLE `gamification_state` (
	`id` text PRIMARY KEY,
	`user_id` text DEFAULT 'anon' NOT NULL,
	`xp` integer DEFAULT 0 NOT NULL,
	`last_active_date` text,
	`streak_days` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);

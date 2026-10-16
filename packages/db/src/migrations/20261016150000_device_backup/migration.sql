CREATE TABLE `device_backup` (
	`id` text PRIMARY KEY,
	`payload` text NOT NULL,
	`material_count` integer DEFAULT 0 NOT NULL,
	`progress_count` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
DROP TABLE `profile_backup`;

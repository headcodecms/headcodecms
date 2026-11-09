CREATE TABLE `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`creation_time` integer NOT NULL,
	`slug` text NOT NULL,
	`name` text,
	`modification_time` integer NOT NULL,
	`version_id` text NOT NULL,
	FOREIGN KEY (`version_id`) REFERENCES `versions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `entries_version` ON `entries` (`version_id`);--> statement-breakpoint
CREATE INDEX `entries_slug` ON `entries` (`slug`,`version_id`);--> statement-breakpoint
CREATE INDEX `entries_slug_name` ON `entries` (`slug`,`name`,`version_id`);--> statement-breakpoint
CREATE TABLE `images` (
	`id` text PRIMARY KEY NOT NULL,
	`creation_time` integer NOT NULL,
	`storage_id` text NOT NULL,
	`src` text NOT NULL,
	`alt` text NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`blur_data_url` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`size` integer NOT NULL,
	`filter` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `images_creation_time` ON `images` (`creation_time`);--> statement-breakpoint
CREATE TABLE `sections` (
	`id` text PRIMARY KEY NOT NULL,
	`creation_time` integer NOT NULL,
	`name` text NOT NULL,
	`pos` integer NOT NULL,
	`data` text NOT NULL,
	`entry_id` text NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sections_entry` ON `sections` (`entry_id`);--> statement-breakpoint
CREATE TABLE `uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `versions` (
	`id` text PRIMARY KEY NOT NULL,
	`creation_time` integer NOT NULL,
	`live` integer NOT NULL,
	`draft` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `versions_live` ON `versions` (`live`);--> statement-breakpoint
CREATE INDEX `versions_draft` ON `versions` (`draft`);
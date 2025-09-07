ALTER TABLE `short_links` DROP INDEX `short_links_short_code_unique`;--> statement-breakpoint
ALTER TABLE `short_links` ADD `shortCode` varchar(16) NOT NULL;--> statement-breakpoint
ALTER TABLE `short_links` ADD CONSTRAINT `short_links_shortCode_unique` UNIQUE(`shortCode`);--> statement-breakpoint
ALTER TABLE `short_links` DROP COLUMN `short_code`;
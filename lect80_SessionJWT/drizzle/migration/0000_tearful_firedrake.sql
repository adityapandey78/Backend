CREATE TABLE `short_links` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`short_code` varchar(16) NOT NULL,
	`url` varchar(2048) NOT NULL,
	CONSTRAINT `short_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `short_links_short_code_unique` UNIQUE(`short_code`)
);

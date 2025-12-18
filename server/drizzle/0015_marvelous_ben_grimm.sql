ALTER TABLE `designs` ADD `size` varchar(10) DEFAULT 'M';--> statement-breakpoint
ALTER TABLE `orders` ADD `size` varchar(10) DEFAULT 'M' NOT NULL;
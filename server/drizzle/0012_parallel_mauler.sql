CREATE TABLE `pricing` (
	`id` int AUTO_INCREMENT NOT NULL,
	`item_type` varchar(50) NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`description` text,
	`is_active` boolean DEFAULT true,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `pricing_id` PRIMARY KEY(`id`),
	CONSTRAINT `pricing_item_type_unique` UNIQUE(`item_type`)
);

CREATE TABLE `cities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`country_id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`is_capital` boolean DEFAULT false,
	`is_active` boolean DEFAULT true,
	`sort_order` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `countries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`code` varchar(2) NOT NULL,
	`capital_city` varchar(100) NOT NULL,
	`is_active` boolean DEFAULT true,
	`sort_order` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `countries_id` PRIMARY KEY(`id`),
	CONSTRAINT `countries_name_unique` UNIQUE(`name`),
	CONSTRAINT `countries_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `shipping_address` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `country_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `city_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `detailed_address` text NOT NULL;--> statement-breakpoint
ALTER TABLE `cities` ADD CONSTRAINT `cities_country_id_countries_id_fk` FOREIGN KEY (`country_id`) REFERENCES `countries`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `country_id_idx` ON `cities` (`country_id`);--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_country_id_countries_id_fk` FOREIGN KEY (`country_id`) REFERENCES `countries`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_city_id_cities_id_fk` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `country_id_idx` ON `orders` (`country_id`);--> statement-breakpoint
CREATE INDEX `city_id_idx` ON `orders` (`city_id`);
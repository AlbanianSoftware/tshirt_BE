CREATE TABLE `shipping_prices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`country_id` int NOT NULL,
	`city_id` int,
	`price` decimal(10,2) NOT NULL,
	`description` text,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shipping_prices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `shipping_prices` ADD CONSTRAINT `shipping_prices_country_id_countries_id_fk` FOREIGN KEY (`country_id`) REFERENCES `countries`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shipping_prices` ADD CONSTRAINT `shipping_prices_city_id_cities_id_fk` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `country_id_idx` ON `shipping_prices` (`country_id`);--> statement-breakpoint
CREATE INDEX `city_id_idx` ON `shipping_prices` (`city_id`);
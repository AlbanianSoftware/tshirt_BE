CREATE TABLE `cart_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`design_id` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`added_at` timestamp DEFAULT (now()),
	CONSTRAINT `cart_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_design_id_designs_id_fk` FOREIGN KEY (`design_id`) REFERENCES `designs`(`id`) ON DELETE cascade ON UPDATE no action;
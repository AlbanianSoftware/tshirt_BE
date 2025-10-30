CREATE TABLE `designs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`color` varchar(7) NOT NULL,
	`logo_decal` text,
	`full_decal` text,
	`is_logo_texture` boolean DEFAULT false,
	`is_full_texture` boolean DEFAULT false,
	`text_data` text,
	`thumbnail` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `designs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `designs` ADD CONSTRAINT `designs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
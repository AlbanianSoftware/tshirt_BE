CREATE TABLE `community_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`design_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` mediumtext,
	`views` int DEFAULT 0,
	`likes` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `community_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `community_posts` ADD CONSTRAINT `community_posts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `community_posts` ADD CONSTRAINT `community_posts_design_id_designs_id_fk` FOREIGN KEY (`design_id`) REFERENCES `designs`(`id`) ON DELETE cascade ON UPDATE no action;
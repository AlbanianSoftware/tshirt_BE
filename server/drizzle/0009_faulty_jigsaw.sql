CREATE TABLE `post_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`post_id` int NOT NULL,
	`content` mediumtext NOT NULL,
	`deleted_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `post_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `post_likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`post_id` int NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `post_likes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `community_posts` ADD `likes_count` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `community_posts` ADD `comments_count` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `post_comments` ADD CONSTRAINT `post_comments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_comments` ADD CONSTRAINT `post_comments_post_id_community_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `community_posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_likes` ADD CONSTRAINT `post_likes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_likes` ADD CONSTRAINT `post_likes_post_id_community_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `community_posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `post_id_idx` ON `post_comments` (`post_id`);--> statement-breakpoint
CREATE INDEX `deleted_at_idx` ON `post_comments` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `user_post_idx` ON `post_likes` (`user_id`,`post_id`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `community_posts` (`user_id`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `community_posts` (`created_at`);--> statement-breakpoint
CREATE INDEX `deleted_at_idx` ON `community_posts` (`deleted_at`);--> statement-breakpoint
ALTER TABLE `community_posts` DROP COLUMN `likes`;
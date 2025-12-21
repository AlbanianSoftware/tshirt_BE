ALTER TABLE `orders` ADD `device_type` varchar(20) DEFAULT 'desktop';--> statement-breakpoint
ALTER TABLE `orders` ADD `user_agent` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `ip_address` varchar(45);
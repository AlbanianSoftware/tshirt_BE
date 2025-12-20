ALTER TABLE `designs` ADD `front_text_decal` mediumtext;--> statement-breakpoint
ALTER TABLE `designs` ADD `front_text_data` mediumtext;--> statement-breakpoint
ALTER TABLE `designs` ADD `has_front_text` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `designs` ADD `back_text_decal` mediumtext;--> statement-breakpoint
ALTER TABLE `designs` ADD `back_text_data` mediumtext;--> statement-breakpoint
ALTER TABLE `designs` ADD `has_back_text` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `orders` ADD `front_text_decal` mediumtext;--> statement-breakpoint
ALTER TABLE `orders` ADD `back_text_decal` mediumtext;--> statement-breakpoint
ALTER TABLE `orders` ADD `front_text_data` mediumtext;--> statement-breakpoint
ALTER TABLE `orders` ADD `back_text_data` mediumtext;
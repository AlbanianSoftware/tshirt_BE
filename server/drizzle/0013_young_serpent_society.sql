ALTER TABLE `designs` ADD `back_logo_decal` mediumtext;--> statement-breakpoint
ALTER TABLE `designs` ADD `has_back_logo` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `designs` ADD `back_logo_position` mediumtext;
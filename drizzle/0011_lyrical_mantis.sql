CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`design_id` int NOT NULL,
	`status` enum('pending','processing','shipped','delivered') DEFAULT 'pending',
	`customer_name` varchar(100) NOT NULL,
	`customer_surname` varchar(100) NOT NULL,
	`phone_number` varchar(20) NOT NULL,
	`shipping_address` text NOT NULL,
	`order_date` timestamp NOT NULL DEFAULT (now()),
	`shipped_date` timestamp,
	`price` decimal(10,2) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);

// db/schema.js
import {
  mysqlTable,
  varchar,
  int,
  timestamp,
  boolean,
  mediumtext,
} from "drizzle-orm/mysql-core";

// Users table
export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const designs = mysqlTable("designs", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  color: varchar("color", { length: 7 }).notNull(),
  shirtType: varchar("shirt_type", { length: 50 }).notNull().default("tshirt"),
  logoDecal: mediumtext("logo_decal"),
  fullDecal: mediumtext("full_decal"),
  isLogoTexture: boolean("is_logo_texture").default(false),
  isFullTexture: boolean("is_full_texture").default(false),
  textData: mediumtext("text_data"),
  logoData: mediumtext("logo_data"), // ✨ NEW: Store logo transformation data (scale, position, rotation, etc.)
  thumbnail: mediumtext("thumbnail"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// 🆕 Community Posts Table
export const communityPosts = mysqlTable("community_posts", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  designId: int("design_id")
    .notNull()
    .references(() => designs.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: mediumtext("description"),
  views: int("views").default(0),
  likes: int("likes").default(0), // Optional: for future feature
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const cartItems = mysqlTable("cart_items", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  designId: int("design_id")
    .notNull()
    .references(() => designs.id, { onDelete: "cascade" }),
  quantity: int("quantity").notNull().default(1),
  addedAt: timestamp("added_at").defaultNow(),
});

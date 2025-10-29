// db/schema.js
import {
  mysqlTable,
  varchar,
  text,
  int,
  timestamp,
  boolean,
} from "drizzle-orm/mysql-core";

// Users table
export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Designs table
export const designs = mysqlTable("designs", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),

  // Shirt customization data
  color: varchar("color", { length: 7 }).notNull(), // hex color
  logoDecal: text("logo_decal"), // base64 or URL
  fullDecal: text("full_decal"), // base64 or URL
  isLogoTexture: boolean("is_logo_texture").default(false),
  isFullTexture: boolean("is_full_texture").default(false),

  // Text data stored as JSON
  textData: text("text_data"), // JSON stringified text object

  // Thumbnail for gallery view
  thumbnail: text("thumbnail"), // base64 image of the design

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

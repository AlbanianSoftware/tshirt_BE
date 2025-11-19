// db/schema.js - UPDATED with likes, comments, and soft deletes
import {
  mysqlTable,
  varchar,
  int,
  timestamp,
  boolean,
  mediumtext,
  json,
  index,
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
  logoData: mediumtext("logo_data"),
  logoPosition: mediumtext("logo_position"),
  thumbnail: mediumtext("thumbnail"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const communityPosts = mysqlTable(
  "community_posts",
  {
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
    likesCount: int("likes_count").default(0), // 🆕 Cached like count
    commentsCount: int("comments_count").default(0), // 🆕 Cached comment count
    deletedAt: timestamp("deleted_at"), // 🆕 Soft delete
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    userIdIdx: index("user_id_idx").on(table.userId),
    createdAtIdx: index("created_at_idx").on(table.createdAt),
    deletedAtIdx: index("deleted_at_idx").on(table.deletedAt),
  })
);

// 🆕 Likes table - tracks who liked what
export const postLikes = mysqlTable(
  "post_likes",
  {
    id: int("id").primaryKey().autoincrement(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: int("post_id")
      .notNull()
      .references(() => communityPosts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    userPostIdx: index("user_post_idx").on(table.userId, table.postId),
  })
);

// 🆕 Comments table
export const postComments = mysqlTable(
  "post_comments",
  {
    id: int("id").primaryKey().autoincrement(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: int("post_id")
      .notNull()
      .references(() => communityPosts.id, { onDelete: "cascade" }),
    content: mediumtext("content").notNull(),
    deletedAt: timestamp("deleted_at"), // 🆕 Soft delete for comments
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    postIdIdx: index("post_id_idx").on(table.postId),
    deletedAtIdx: index("deleted_at_idx").on(table.deletedAt),
  })
);

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

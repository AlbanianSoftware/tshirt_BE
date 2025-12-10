// db/schema.js - UPDATED with likes, comments, and soft deletes
import {
  mysqlTable,
  serial,
  varchar,
  int,
  boolean,
  text,
  mediumtext,
  json,
  timestamp,
  index,
  mysqlEnum,
  double,
  decimal,
} from "drizzle-orm/mysql-core";

// Users table
// Add this to your users table in db/schema.js
export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  isAdmin: boolean("is_admin").default(false), // 👈 ADD THIS LINE
  createdAt: timestamp("created_at").defaultNow(),
});

// db/schema.js - Add these fields to the designs table
export const designs = mysqlTable("designs", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  color: varchar("color", { length: 7 }).notNull(),
  shirtType: varchar("shirt_type", { length: 50 }).notNull().default("tshirt"),

  // FRONT LOGO
  logoDecal: mediumtext("logo_decal"),
  isLogoTexture: boolean("is_logo_texture").default(false),
  logoPosition: mediumtext("logo_position"),

  // 🆕 BACK LOGO - ADD THESE
  backLogoDecal: mediumtext("back_logo_decal"), // Image for back logo
  hasBackLogo: boolean("has_back_logo").default(false), // Flag if back logo exists
  backLogoPosition: mediumtext("back_logo_position"), // Position data for back

  fullDecal: mediumtext("full_decal"),
  isFullTexture: boolean("is_full_texture").default(false),
  textData: mediumtext("text_data"),
  logoData: mediumtext("logo_data"),
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

export const pricing = mysqlTable("pricing", {
  id: int("id").primaryKey().autoincrement(),
  itemType: varchar("item_type", { length: 50 }).notNull().unique(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  createdAt: timestamp("created_at").defaultNow(),
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

export const orders = mysqlTable("orders", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  designId: int("design_id").notNull(),
  status: mysqlEnum("status", [
    "pending",
    "processing",
    "shipped",
    "delivered",
  ]).default("pending"),
  customerName: varchar("customer_name", { length: 100 }).notNull(),
  customerSurname: varchar("customer_surname", { length: 100 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  shippingAddress: text("shipping_address").notNull(),
  orderDate: timestamp("order_date").defaultNow().notNull(),
  shippedDate: timestamp("shipped_date"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

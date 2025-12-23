// db/schema.js - UPDATED with shipping locations
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
export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Countries table - NEW
export const countries = mysqlTable("countries", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  code: varchar("code", { length: 2 }).notNull().unique(), // AL, XK, MK, ME
  capitalCity: varchar("capital_city", { length: 100 }).notNull(),
  isActive: boolean("is_active").default(true),
  sortOrder: int("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Cities table - NEW
export const cities = mysqlTable(
  "cities",
  {
    id: int("id").primaryKey().autoincrement(),
    countryId: int("country_id")
      .notNull()
      .references(() => countries.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    isCapital: boolean("is_capital").default(false),
    isActive: boolean("is_active").default(true),
    sortOrder: int("sort_order").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    countryIdIdx: index("country_id_idx").on(table.countryId),
  })
);

// Designs table
export const designs = mysqlTable("designs", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  color: varchar("color", { length: 7 }).notNull(),
  shirtType: varchar("shirt_type", { length: 50 }).notNull().default("tshirt"),
  size: varchar("size", { length: 10 }).default("M"),

  // FRONT LOGO
  logoDecal: mediumtext("logo_decal"),
  isLogoTexture: boolean("is_logo_texture").default(false),
  logoPosition: mediumtext("logo_position"),

  // BACK LOGO
  backLogoDecal: mediumtext("back_logo_decal"),
  hasBackLogo: boolean("has_back_logo").default(false),
  backLogoPosition: mediumtext("back_logo_position"),

  // FRONT TEXT
  frontTextDecal: mediumtext("front_text_decal"),
  frontTextData: mediumtext("front_text_data"),
  hasFrontText: boolean("has_front_text").default(false),

  // BACK TEXT
  backTextDecal: mediumtext("back_text_decal"),
  backTextData: mediumtext("back_text_data"),
  hasBackText: boolean("has_back_text").default(false),

  // FULL TEXTURE
  fullDecal: mediumtext("full_decal"),
  isFullTexture: boolean("is_full_texture").default(false),

  textData: mediumtext("text_data"),
  logoData: mediumtext("logo_data"),
  thumbnail: mediumtext("thumbnail"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Orders table - UPDATED with structured shipping
export const orders = mysqlTable(
  "orders",
  {
    id: int("id").primaryKey().autoincrement(),
    userId: int("user_id").notNull(),
    designId: int("design_id").notNull(),
    size: varchar("size", { length: 10 }).notNull().default("M"),
    status: mysqlEnum("status", [
      "pending",
      "processing",
      "shipped",
      "delivered",
    ]).default("pending"),

    // Customer info
    customerName: varchar("customer_name", { length: 100 }).notNull(),
    customerSurname: varchar("customer_surname", { length: 100 }).notNull(),
    phoneNumber: varchar("phone_number", { length: 20 }).notNull(),

    // NEW: Structured shipping
    countryId: int("country_id")
      .notNull()
      .references(() => countries.id),
    cityId: int("city_id")
      .notNull()
      .references(() => cities.id),
    detailedAddress: text("detailed_address").notNull(),

    // DEPRECATED: Keep for migration compatibility
    shippingAddress: text("shipping_address"),

    orderDate: timestamp("order_date").defaultNow().notNull(),
    shippedDate: timestamp("shipped_date"),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),

    // Device tracking
    deviceType: varchar("device_type", { length: 20 }).default("desktop"),
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 45 }),

    // TEXT FIELDS
    frontTextDecal: mediumtext("front_text_decal"),
    backTextDecal: mediumtext("back_text_decal"),
    frontTextData: mediumtext("front_text_data"),
    backTextData: mediumtext("back_text_data"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    countryIdIdx: index("country_id_idx").on(table.countryId),
    cityIdIdx: index("city_id_idx").on(table.cityId),
  })
);

export const colors = mysqlTable("colors", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 50 }).notNull(),
  hexCode: varchar("hex_code", { length: 7 }).notNull(),
  isActive: boolean("is_active").default(true),
  sortOrder: int("sort_order").default(0),
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
    likesCount: int("likes_count").default(0),
    commentsCount: int("comments_count").default(0),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    userIdIdx: index("user_id_idx").on(table.userId),
    createdAtIdx: index("created_at_idx").on(table.createdAt),
    deletedAtIdx: index("deleted_at_idx").on(table.deletedAt),
  })
);

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
    deletedAt: timestamp("deleted_at"),
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

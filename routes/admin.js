import express from "express";
import { db } from "../db/index.js";
import {
  users,
  designs,
  orders,
  pricing,
  colors,
  countries,
  cities,
  shippingPrices,
} from "../db/schema.js";
import { eq, sql } from "drizzle-orm";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Helpers
const toFullUrl = (path, req) => {
  if (!path || path.startsWith("http") || path.startsWith("data:image"))
    return path;
  if (path.startsWith("/")) {
    const baseUrl =
      process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
    return `${baseUrl}${path}`;
  }
  return path;
};

const isValidHex = (hex) => /^#[0-9A-Fa-f]{6}$/.test(hex);

// Middleware
const isAdmin = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id || req.user.sub;
    if (!userId)
      return res.status(403).json({ message: "Invalid token structure" });

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

router.use(authenticateToken, isAdmin);

// Order fields for queries
const orderFields = {
  id: orders.id,
  userId: orders.userId,
  designId: orders.designId,
  status: orders.status,
  size: orders.size,
  customerName: orders.customerName,
  customerSurname: orders.customerSurname,
  phoneNumber: orders.phoneNumber,
  countryId: orders.countryId,
  cityId: orders.cityId,
  detailedAddress: orders.detailedAddress,
  shippingAddress: orders.shippingAddress,
  orderDate: orders.orderDate,
  shippedDate: orders.shippedDate,
  price: orders.price,
  deviceType: orders.deviceType,
  userAgent: orders.userAgent,
  ipAddress: orders.ipAddress,
  createdAt: orders.createdAt,
  username: users.username,
  userEmail: users.email,
  designName: designs.name,
  designThumbnail: designs.thumbnail,
  designColor: designs.color,
  shirtType: designs.shirtType,
  logoDecal: designs.logoDecal,
  backLogoDecal: designs.backLogoDecal,
  hasBackLogo: designs.hasBackLogo,
  logoPosition: designs.logoPosition,
  fullDecal: designs.fullDecal,
  isLogoTexture: designs.isLogoTexture,
  isFullTexture: designs.isFullTexture,
  frontTextDecal: designs.frontTextDecal,
  backTextDecal: designs.backTextDecal,
  frontTextData: designs.frontTextData,
  backTextData: designs.backTextData,
  hasFrontText: designs.hasFrontText,
  hasBackText: designs.hasBackText,
  countryName: countries.name,
  countryCode: countries.code,
  cityName: cities.name,
};

const processOrder = (order, req) => {
  let logoPositions = order.logoPosition;
  if (typeof logoPositions === "string") {
    try {
      logoPositions = JSON.parse(logoPositions);
    } catch {
      logoPositions = ["front"];
    }
  }

  return {
    ...order,
    logoPosition: logoPositions,
    designThumbnail: toFullUrl(order.designThumbnail, req),
    logoDecal: toFullUrl(order.logoDecal, req),
    backLogoDecal: toFullUrl(order.backLogoDecal, req),
    fullDecal: toFullUrl(order.fullDecal, req),
    frontTextDecal: toFullUrl(order.frontTextDecal, req),
    backTextDecal: toFullUrl(order.backTextDecal, req),
  };
};

// Orders
router.get("/orders", async (req, res) => {
  try {
    const allOrders = await db
      .select(orderFields)
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(designs, eq(orders.designId, designs.id))
      .leftJoin(countries, eq(orders.countryId, countries.id))
      .leftJoin(cities, eq(orders.cityId, cities.id))
      .orderBy(sql`${orders.orderDate} DESC`);

    res.json(allOrders.map((order) => processOrder(order, req)));
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/orders/:id", async (req, res) => {
  try {
    const [order] = await db
      .select(orderFields)
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(designs, eq(orders.designId, designs.id))
      .leftJoin(countries, eq(orders.countryId, countries.id))
      .leftJoin(cities, eq(orders.cityId, cities.id))
      .where(eq(orders.id, parseInt(req.params.id)));

    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(processOrder(order, req));
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/orders/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "processing", "shipped", "delivered"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updateData = { status };
    if (status === "shipped") updateData.shippedDate = new Date();

    await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, parseInt(req.params.id)));
    res.json({ message: "Order status updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Pricing
router.get("/pricing", async (req, res) => {
  try {
    const allPricing = await db
      .select()
      .from(pricing)
      .orderBy(pricing.itemType);
    res.json(allPricing);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/pricing/:id", async (req, res) => {
  try {
    const { price, description, isActive } = req.body;
    if (price !== undefined && price < 0) {
      return res.status(400).json({ message: "Price cannot be negative" });
    }

    const updateData = { updatedAt: new Date() };
    if (price !== undefined) updateData.price = price.toString();
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    await db
      .update(pricing)
      .set(updateData)
      .where(eq(pricing.id, parseInt(req.params.id)));
    res.json({ message: "Pricing updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/pricing", async (req, res) => {
  try {
    const { itemType, price, description } = req.body;
    if (!itemType || price === undefined) {
      return res.status(400).json({ message: "Item type and price required" });
    }

    await db.insert(pricing).values({
      itemType,
      price: price.toString(),
      description,
      isActive: true,
    });

    res.status(201).json({ message: "Pricing item created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/pricing/:id", async (req, res) => {
  try {
    await db.delete(pricing).where(eq(pricing.id, parseInt(req.params.id)));
    res.json({ message: "Pricing item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Colors
router.get("/colors", async (req, res) => {
  try {
    const allColors = await db.select().from(colors).orderBy(colors.sortOrder);
    res.json(allColors);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/colors", async (req, res) => {
  try {
    const { name, hexCode, isActive = true, sortOrder = 0 } = req.body;

    if (!name || !hexCode) {
      return res.status(400).json({ message: "Name and hex code required" });
    }
    if (!isValidHex(hexCode)) {
      return res.status(400).json({ message: "Invalid hex code format" });
    }

    const [newColor] = await db
      .insert(colors)
      .values({ name, hexCode: hexCode.toUpperCase(), isActive, sortOrder })
      .$returningId();

    const [insertedColor] = await db
      .select()
      .from(colors)
      .where(eq(colors.id, newColor.id));
    res.status(201).json(insertedColor);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/colors/:id", async (req, res) => {
  try {
    const updates = req.body;
    if (updates.hexCode) {
      if (!isValidHex(updates.hexCode)) {
        return res.status(400).json({ message: "Invalid hex code format" });
      }
      updates.hexCode = updates.hexCode.toUpperCase();
    }

    await db
      .update(colors)
      .set(updates)
      .where(eq(colors.id, parseInt(req.params.id)));
    const [updatedColor] = await db
      .select()
      .from(colors)
      .where(eq(colors.id, parseInt(req.params.id)));
    res.json(updatedColor);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/colors/:id", async (req, res) => {
  try {
    await db.delete(colors).where(eq(colors.id, parseInt(req.params.id)));
    res.json({ message: "Color deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Shipping Prices
const shippingFields = {
  id: shippingPrices.id,
  countryId: shippingPrices.countryId,
  cityId: shippingPrices.cityId,
  price: shippingPrices.price,
  description: shippingPrices.description,
  isActive: shippingPrices.isActive,
  countryName: countries.name,
  countryCode: countries.code,
  cityName: cities.name,
};

router.get("/shipping-prices", async (req, res) => {
  try {
    const allShipping = await db
      .select(shippingFields)
      .from(shippingPrices)
      .leftJoin(countries, eq(shippingPrices.countryId, countries.id))
      .leftJoin(cities, eq(shippingPrices.cityId, cities.id))
      .orderBy(countries.name, cities.name);

    res.json(allShipping);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/shipping-prices", async (req, res) => {
  try {
    const { countryId, cityId, price, description } = req.body;

    if (!countryId || price === undefined) {
      return res.status(400).json({ message: "Country and price required" });
    }

    const existing = await db
      .select()
      .from(shippingPrices)
      .where(
        cityId
          ? sql`${shippingPrices.countryId} = ${countryId} AND ${shippingPrices.cityId} = ${cityId}`
          : sql`${shippingPrices.countryId} = ${countryId} AND ${shippingPrices.cityId} IS NULL`
      );

    if (existing.length > 0) {
      return res
        .status(400)
        .json({ message: "Shipping rule already exists for this location" });
    }

    const [newShipping] = await db
      .insert(shippingPrices)
      .values({
        countryId: parseInt(countryId),
        cityId: cityId ? parseInt(cityId) : null,
        price: price.toString(),
        description,
        isActive: true,
      })
      .$returningId();

    const [inserted] = await db
      .select(shippingFields)
      .from(shippingPrices)
      .leftJoin(countries, eq(shippingPrices.countryId, countries.id))
      .leftJoin(cities, eq(shippingPrices.cityId, cities.id))
      .where(eq(shippingPrices.id, newShipping.id));

    res.status(201).json(inserted);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/shipping-prices/:id", async (req, res) => {
  try {
    const { price, description, isActive } = req.body;
    const updateData = { updatedAt: new Date() };

    if (price !== undefined) updateData.price = price.toString();
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    await db
      .update(shippingPrices)
      .set(updateData)
      .where(eq(shippingPrices.id, parseInt(req.params.id)));

    const [updated] = await db
      .select(shippingFields)
      .from(shippingPrices)
      .leftJoin(countries, eq(shippingPrices.countryId, countries.id))
      .leftJoin(cities, eq(shippingPrices.cityId, cities.id))
      .where(eq(shippingPrices.id, parseInt(req.params.id)));

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/shipping-prices/:id", async (req, res) => {
  try {
    await db
      .delete(shippingPrices)
      .where(eq(shippingPrices.id, parseInt(req.params.id)));
    res.json({ message: "Shipping price deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

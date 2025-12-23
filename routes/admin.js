// server/routes/admin.js - UPDATED GET /orders route with shipping data
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
} from "../db/schema.js";
import { eq, sql } from "drizzle-orm";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// ============================================================================
// HELPERS
// ============================================================================

const toFullUrl = (path, req) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  if (path.startsWith("data:image")) return path;
  if (path.startsWith("/")) {
    const baseUrl =
      process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
    return `${baseUrl}${path}`;
  }
  return path;
};

const isValidHex = (hex) => /^#[0-9A-Fa-f]{6}$/.test(hex);

// ============================================================================
// MIDDLEWARE
// ============================================================================

const isAdmin = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id || req.user.sub;

    if (!userId) {
      return res.status(403).json({ message: "Invalid token structure" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      return res.status(403).json({ message: "User not found" });
    }

    if (!user.isAdmin) {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    next();
  } catch (error) {
    console.error("Admin check error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

router.use(authenticateToken);
router.use(isAdmin);

// ============================================================================
// ORDER ROUTES - UPDATED WITH SHIPPING DATA
// ============================================================================

router.get("/orders", async (req, res) => {
  try {
    const allOrders = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        designId: orders.designId,
        status: orders.status,
        size: orders.size,
        customerName: orders.customerName,
        customerSurname: orders.customerSurname,
        phoneNumber: orders.phoneNumber,
        // NEW: Structured shipping fields
        countryId: orders.countryId,
        cityId: orders.cityId,
        detailedAddress: orders.detailedAddress,
        // Legacy field for backward compatibility
        shippingAddress: orders.shippingAddress,
        orderDate: orders.orderDate,
        shippedDate: orders.shippedDate,
        price: orders.price,
        deviceType: orders.deviceType,
        userAgent: orders.userAgent,
        ipAddress: orders.ipAddress,
        createdAt: orders.createdAt,
        // User data
        username: users.username,
        userEmail: users.email,
        // Design data
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
        // NEW: Shipping location data
        countryName: countries.name,
        countryCode: countries.code,
        cityName: cities.name,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(designs, eq(orders.designId, designs.id))
      .leftJoin(countries, eq(orders.countryId, countries.id))
      .leftJoin(cities, eq(orders.cityId, cities.id))
      .orderBy(sql`${orders.orderDate} DESC`);

    const ordersWithUrls = allOrders.map((order) => {
      let logoPositions = order.logoPosition;
      if (typeof logoPositions === "string") {
        try {
          logoPositions = JSON.parse(logoPositions);
        } catch (e) {
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
    });

    console.log(
      `✅ Fetched ${ordersWithUrls.length} orders for admin with shipping data`
    );
    res.json(ordersWithUrls);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single order
router.get("/orders/:id", async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);

    const [order] = await db
      .select({
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
        fullDecal: designs.fullDecal,
        isLogoTexture: designs.isLogoTexture,
        isFullTexture: designs.isFullTexture,
        countryName: countries.name,
        countryCode: countries.code,
        cityName: cities.name,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(designs, eq(orders.designId, designs.id))
      .leftJoin(countries, eq(orders.countryId, countries.id))
      .leftJoin(cities, eq(orders.cityId, cities.id))
      .where(eq(orders.id, orderId));

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const orderWithUrls = {
      ...order,
      designThumbnail: toFullUrl(order.designThumbnail, req),
      logoDecal: toFullUrl(order.logoDecal, req),
      backLogoDecal: toFullUrl(order.backLogoDecal, req),
      fullDecal: toFullUrl(order.fullDecal, req),
    };

    res.json(orderWithUrls);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update order status
router.patch("/orders/:id/status", async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { status } = req.body;

    const validStatuses = ["pending", "processing", "shipped", "delivered"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updateData = { status };
    if (status === "shipped") {
      updateData.shippedDate = new Date();
    }

    await db.update(orders).set(updateData).where(eq(orders.id, orderId));

    res.json({ message: "Order status updated successfully" });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================================================================
// PRICING ROUTES (unchanged)
// ============================================================================

router.get("/pricing", async (req, res) => {
  try {
    const allPricing = await db
      .select()
      .from(pricing)
      .orderBy(pricing.itemType);
    res.json(allPricing);
  } catch (error) {
    console.error("Error fetching pricing:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/pricing/:id", async (req, res) => {
  try {
    const pricingId = parseInt(req.params.id);
    const { price, description, isActive } = req.body;

    if (price !== undefined && price < 0) {
      return res.status(400).json({ message: "Price cannot be negative" });
    }

    const updateData = { updatedAt: new Date() };
    if (price !== undefined) updateData.price = price.toString();
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    await db.update(pricing).set(updateData).where(eq(pricing.id, pricingId));
    res.json({ message: "Pricing updated successfully" });
  } catch (error) {
    console.error("Error updating pricing:", error);
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
    console.error("Error creating pricing:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/pricing/:id", async (req, res) => {
  try {
    const pricingId = parseInt(req.params.id);
    await db.delete(pricing).where(eq(pricing.id, pricingId));
    res.json({ message: "Pricing item deleted successfully" });
  } catch (error) {
    console.error("Error deleting pricing:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================================================================
// COLORS ROUTES (unchanged)
// ============================================================================

router.get("/colors", async (req, res) => {
  try {
    const allColors = await db.select().from(colors).orderBy(colors.sortOrder);
    res.json(allColors);
  } catch (error) {
    console.error("Error fetching colors:", error);
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
      .values({
        name,
        hexCode: hexCode.toUpperCase(),
        isActive,
        sortOrder,
      })
      .$returningId();

    const [insertedColor] = await db
      .select()
      .from(colors)
      .where(eq(colors.id, newColor.id));
    res.status(201).json(insertedColor);
  } catch (error) {
    console.error("Error adding color:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/colors/:id", async (req, res) => {
  try {
    const colorId = parseInt(req.params.id);
    const updates = req.body;

    if (updates.hexCode) {
      if (!isValidHex(updates.hexCode)) {
        return res.status(400).json({ message: "Invalid hex code format" });
      }
      updates.hexCode = updates.hexCode.toUpperCase();
    }

    await db.update(colors).set(updates).where(eq(colors.id, colorId));
    const [updatedColor] = await db
      .select()
      .from(colors)
      .where(eq(colors.id, colorId));
    res.json(updatedColor);
  } catch (error) {
    console.error("Error updating color:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/colors/:id", async (req, res) => {
  try {
    const colorId = parseInt(req.params.id);
    await db.delete(colors).where(eq(colors.id, colorId));
    res.json({ message: "Color deleted successfully" });
  } catch (error) {
    console.error("Error deleting color:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "../db/index.js";
import { orders, designs } from "../db/schema.js";
import { eq, sql, desc } from "drizzle-orm";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔥 Helper to convert paths to full URLs
const toFullUrl = (path, req) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  if (path.startsWith("data:image")) return path;
  // Convert ANY path starting with / to full URL
  if (path.startsWith("/")) {
    const baseUrl =
      process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
    return `${baseUrl}${path}`;
  }
  return path;
};

// Create new order (when user completes checkout)
router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const {
      designId,
      customerName,
      customerSurname,
      phoneNumber,
      shippingAddress,
      price,
    } = req.body;

    // Validate required fields
    if (
      !designId ||
      !customerName ||
      !customerSurname ||
      !phoneNumber ||
      !shippingAddress ||
      !price
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Verify design exists
    const [design] = await db
      .select()
      .from(designs)
      .where(eq(designs.id, designId));

    if (!design) {
      return res.status(404).json({ message: "Design not found" });
    }

    // Create order
    const result = await db.insert(orders).values({
      userId,
      designId,
      customerName,
      customerSurname,
      phoneNumber,
      shippingAddress,
      price,
      status: "pending",
      orderDate: new Date(),
    });

    // 🔥 FIX: Get insertId properly for MySQL
    const orderId = Array.isArray(result)
      ? result[0]?.insertId
      : result.insertId;

    res.status(201).json({
      message: "Order created successfully",
      orderId: orderId,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 🔥 UPDATED: Get user's orders with back logo support
router.get("/my-orders", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const userOrders = await db
      .select({
        id: orders.id,
        status: orders.status,
        orderDate: orders.orderDate,
        shippedDate: orders.shippedDate,
        price: orders.price,
        customerName: orders.customerName,
        customerSurname: orders.customerSurname,
        shippingAddress: orders.shippingAddress,
        phoneNumber: orders.phoneNumber,
        designName: designs.name,
        designThumbnail: designs.thumbnail,
        logoDecal: designs.logoDecal,
        backLogoDecal: designs.backLogoDecal, // 🆕 Back logo
        hasBackLogo: designs.hasBackLogo, // 🆕 Back logo flag
        fullDecal: designs.fullDecal,
        shirtType: designs.shirtType,
      })
      .from(orders)
      .leftJoin(designs, eq(orders.designId, designs.id))
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.orderDate));

    // 🔥 Convert file paths to full URLs including back logo
    const ordersWithUrls = userOrders.map((order) => ({
      ...order,
      designThumbnail: toFullUrl(order.designThumbnail, req),
      logoDecal: toFullUrl(order.logoDecal, req),
      backLogoDecal: toFullUrl(order.backLogoDecal, req), // 🆕
      fullDecal: toFullUrl(order.fullDecal, req),
    }));

    console.log(
      `✅ Fetched ${ordersWithUrls.length} orders for user ${userId}`
    );

    res.json(ordersWithUrls);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 🔥 Download front logo
router.get("/:id/download-logo", authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);

    const [order] = await db
      .select({
        logoDecal: designs.logoDecal,
        designName: designs.name,
      })
      .from(orders)
      .leftJoin(designs, eq(orders.designId, designs.id))
      .where(eq(orders.id, orderId));

    if (!order || !order.logoDecal) {
      return res.status(404).json({ message: "Logo not found" });
    }

    let filePath = order.logoDecal;

    // Extract path from full URL if needed
    if (filePath.startsWith("http")) {
      const url = new URL(filePath);
      filePath = url.pathname;
    }

    // 🔥 FIX: Remove leading slash and join with public folder
    const relativePath = filePath.startsWith("/")
      ? filePath.substring(1)
      : filePath;

    const fullPath = path.join(__dirname, "../public", relativePath);

    console.log("🔍 Original path:", order.logoDecal);
    console.log("📂 Looking for file at:", fullPath);

    const filename = `front-${path.basename(fullPath)}`;
    res.download(fullPath, filename, (err) => {
      if (err) {
        console.error("❌ Download error:", err);
        if (!res.headersSent) {
          res.status(404).json({ message: "File not found" });
        }
      } else {
        console.log("✅ Downloaded successfully:", filename);
      }
    });
  } catch (error) {
    console.error("Error downloading logo:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error" });
    }
  }
});

// 🆕 NEW: Download back logo
router.get("/:id/download-back-logo", authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);

    const [order] = await db
      .select({
        backLogoDecal: designs.backLogoDecal,
        designName: designs.name,
      })
      .from(orders)
      .leftJoin(designs, eq(orders.designId, designs.id))
      .where(eq(orders.id, orderId));

    if (!order || !order.backLogoDecal) {
      return res.status(404).json({ message: "Back logo not found" });
    }

    let filePath = order.backLogoDecal;

    // Extract path from full URL if needed
    if (filePath.startsWith("http")) {
      const url = new URL(filePath);
      filePath = url.pathname;
    }

    // 🔥 FIX: Remove leading slash and join with public folder
    const relativePath = filePath.startsWith("/")
      ? filePath.substring(1)
      : filePath;

    const fullPath = path.join(__dirname, "../public", relativePath);

    console.log("🔍 Back logo path:", order.backLogoDecal);
    console.log("📂 Looking for file at:", fullPath);

    const filename = `back-${path.basename(fullPath)}`;
    res.download(fullPath, filename, (err) => {
      if (err) {
        console.error("❌ Download error:", err);
        if (!res.headersSent) {
          res.status(404).json({ message: "File not found" });
        }
      } else {
        console.log("✅ Downloaded back logo:", filename);
      }
    });
  } catch (error) {
    console.error("Error downloading back logo:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error" });
    }
  }
});

// 🔥 Download texture
router.get("/:id/download-texture", authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);

    const [order] = await db
      .select({
        fullDecal: designs.fullDecal,
        designName: designs.name,
      })
      .from(orders)
      .leftJoin(designs, eq(orders.designId, designs.id))
      .where(eq(orders.id, orderId));

    if (!order || !order.fullDecal) {
      return res.status(404).json({ message: "Texture not found" });
    }

    let filePath = order.fullDecal;

    // Extract path from full URL if needed
    if (filePath.startsWith("http")) {
      const url = new URL(filePath);
      filePath = url.pathname;
    }

    // 🔥 FIX: Remove leading slash and join with public folder
    const relativePath = filePath.startsWith("/")
      ? filePath.substring(1)
      : filePath;

    const fullPath = path.join(__dirname, "../public", relativePath);

    console.log("🔍 Original path:", order.fullDecal);
    console.log("📂 Looking for file at:", fullPath);

    const filename = path.basename(fullPath);
    res.download(fullPath, filename, (err) => {
      if (err) {
        console.error("❌ Download error:", err);
        if (!res.headersSent) {
          res.status(404).json({ message: "File not found" });
        }
      } else {
        console.log("✅ Downloaded successfully:", filename);
      }
    });
  } catch (error) {
    console.error("Error downloading texture:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error" });
    }
  }
});

export default router;

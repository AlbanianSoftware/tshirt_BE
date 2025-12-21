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

    console.log("🔍 Fetching orders for user:", userId);

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
        designColor: designs.color,
        size: designs.size,
        logoDecal: designs.logoDecal,
        backLogoDecal: designs.backLogoDecal,
        hasBackLogo: designs.hasBackLogo,
        logoPosition: designs.logoPosition,
        isLogoTexture: designs.isLogoTexture,
        fullDecal: designs.fullDecal,
        isFullTexture: designs.isFullTexture,
        shirtType: designs.shirtType,
        // 🆕 TEXT FIELDS
        frontTextDecal: designs.frontTextDecal,
        backTextDecal: designs.backTextDecal,
        frontTextData: designs.frontTextData,
        backTextData: designs.backTextData,
        hasFrontText: designs.hasFrontText,
        hasBackText: designs.hasBackText,
      })
      .from(orders)
      .leftJoin(designs, eq(orders.designId, designs.id))
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.orderDate));

    console.log("🔍 Raw orders from DB:", userOrders.length);

    // Convert file paths to full URLs + parse JSON fields
    const ordersWithUrls = userOrders.map((order) => {
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
        // 🆕 TEXT URLS
        frontTextDecal: toFullUrl(order.frontTextDecal, req),
        backTextDecal: toFullUrl(order.backTextDecal, req),
      };
    });

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

router.get("/:id/download-front-text", authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);

    const [order] = await db
      .select({
        frontTextDecal: designs.frontTextDecal,
        frontTextData: designs.frontTextData,
        designName: designs.name,
      })
      .from(orders)
      .leftJoin(designs, eq(orders.designId, designs.id))
      .where(eq(orders.id, orderId));

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // If we have the saved texture, use it
    if (order.frontTextDecal) {
      let filePath = order.frontTextDecal;

      if (filePath.startsWith("http")) {
        const url = new URL(filePath);
        filePath = url.pathname;
      }

      const relativePath = filePath.startsWith("/")
        ? filePath.substring(1)
        : filePath;

      const fullPath = path.join(__dirname, "../public", relativePath);

      console.log("📂 Front text file:", fullPath);

      const filename = `order-${orderId}-front-text.png`;
      return res.download(fullPath, filename, (err) => {
        if (err) {
          console.error("❌ Download error:", err);
          if (!res.headersSent) {
            // Fallback: Generate from textData
            generateTextImage(order, "front", res, orderId);
          }
        } else {
          console.log("✅ Front text downloaded:", filename);
        }
      });
    }

    // Fallback: Generate from textData if no saved texture
    if (order.frontTextData) {
      return generateTextImage(order, "front", res, orderId);
    }

    res.status(404).json({ message: "No front text found" });
  } catch (error) {
    console.error("Error downloading front text:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error" });
    }
  }
});

// 🆕 Download back text
router.get("/:id/download-back-text", authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);

    const [order] = await db
      .select({
        backTextDecal: designs.backTextDecal,
        backTextData: designs.backTextData,
        designName: designs.name,
      })
      .from(orders)
      .leftJoin(designs, eq(orders.designId, designs.id))
      .where(eq(orders.id, orderId));

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.backTextDecal) {
      let filePath = order.backTextDecal;

      if (filePath.startsWith("http")) {
        const url = new URL(filePath);
        filePath = url.pathname;
      }

      const relativePath = filePath.startsWith("/")
        ? filePath.substring(1)
        : filePath;

      const fullPath = path.join(__dirname, "../public", relativePath);

      console.log("📂 Back text file:", fullPath);

      const filename = `order-${orderId}-back-text.png`;
      return res.download(fullPath, filename, (err) => {
        if (err) {
          console.error("❌ Download error:", err);
          if (!res.headersSent) {
            generateTextImage(order, "back", res, orderId);
          }
        } else {
          console.log("✅ Back text downloaded:", filename);
        }
      });
    }

    if (order.backTextData) {
      return generateTextImage(order, "back", res, orderId);
    }

    res.status(404).json({ message: "No back text found" });
  } catch (error) {
    console.error("Error downloading back text:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error" });
    }
  }
});

// 🆕 HELPER: Generate text image on-the-fly from config
const generateTextImage = (order, position, res, orderId) => {
  try {
    const textDataField =
      position === "front" ? "frontTextData" : "backTextData";
    const textConfig = JSON.parse(order[textDataField]);

    if (!textConfig || !textConfig.content) {
      return res.status(404).json({ message: "No text data found" });
    }

    const { Canvas } = require("canvas");
    const canvas = new Canvas(1024, 1024);
    const ctx = canvas.getContext("2d");

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Calculate position
    const x = (textConfig.position.x / 100) * canvas.width;
    const y = (textConfig.position.y / 100) * canvas.height;

    // Move to position and rotate
    ctx.translate(x, y);
    ctx.rotate((textConfig.rotation * Math.PI) / 180);

    // Set font
    const fontWeight = textConfig.style.bold ? "bold" : "normal";
    const fontStyle = textConfig.style.italic ? "italic" : "normal";
    ctx.font = `${fontStyle} ${fontWeight} ${textConfig.size}px ${textConfig.font}`;
    ctx.textAlign = textConfig.alignment;
    ctx.textBaseline = "middle";

    // Draw shadow
    if (textConfig.style.shadow) {
      ctx.shadowColor = textConfig.style.shadowColor;
      ctx.shadowBlur = textConfig.style.shadowBlur;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
    }

    // Draw outline
    if (textConfig.style.outline) {
      ctx.strokeStyle = textConfig.style.outlineColor;
      ctx.lineWidth = textConfig.style.outlineWidth;
      ctx.lineJoin = "round";
      ctx.miterLimit = 2;
      ctx.strokeText(textConfig.content, 0, 0);
    }

    // Draw main text
    ctx.fillStyle = textConfig.color;
    ctx.fillText(textConfig.content, 0, 0);

    ctx.restore();

    // Send as PNG
    const buffer = canvas.toBuffer("image/png");
    const filename = `order-${orderId}-${position}-text.png`;

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);

    console.log("✅ Generated text image:", filename);
  } catch (error) {
    console.error("Error generating text image:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to generate text image" });
    }
  }
};

export default router;

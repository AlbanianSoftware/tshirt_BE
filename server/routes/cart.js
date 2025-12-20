// server/routes/cart.js - UPDATED CHECKOUT with device tracking
import express from "express";
import { db } from "../db/index.js";
import {
  sendOrderConfirmation,
  sendAdminNotification,
} from "../utils/emailService.js";
import {
  cartItems,
  designs,
  orders,
  pricing as pricingTable,
  users,
} from "../db/schema.js";
import { eq, and, inArray } from "drizzle-orm";
import { authenticateToken } from "../middleware/auth.js";
import { getDeviceInfo } from "../utils/deviceUtils.js"; // Import device utility

const router = express.Router();

// Helper to convert paths to full URLs
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

// Helper: Calculate price with text support
const calculateOrderPrice = (design, pricingData) => {
  const shirtTypeKey = (design.shirtType || "tshirt").toLowerCase();
  let price = pricingData[shirtTypeKey] || 20;

  if (design.isLogoTexture && design.logoDecal) {
    price += pricingData.logo || 5;
  }

  const hasDedicatedBackLogo =
    design.backLogoDecal && design.backLogoDecal.trim() !== "";
  const hasFrontLogoOnBack =
    design.hasBackLogo && !hasDedicatedBackLogo && design.logoDecal;

  if (hasDedicatedBackLogo || hasFrontLogoOnBack) {
    price += pricingData.back_logo || pricingData.logo || 5;
  }

  if (design.isFullTexture && design.fullDecal) {
    price += pricingData.full_texture || 8;
  }

  if (
    (design.frontTextDecal && design.frontTextDecal.trim() !== "") ||
    design.hasFrontText
  ) {
    price += pricingData.front_text || pricingData.text || 2;
  }

  if (
    (design.backTextDecal && design.backTextDecal.trim() !== "") ||
    design.hasBackText
  ) {
    price += pricingData.back_text || pricingData.text || 2;
  }

  return price;
};

// GET USER'S CART
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const userCart = await db
      .select({
        cartItemId: cartItems.id,
        quantity: cartItems.quantity,
        addedAt: cartItems.addedAt,
        designId: designs.id,
        designName: designs.name,
        color: designs.color,
        size: designs.size,
        logoDecal: designs.logoDecal,
        backLogoDecal: designs.backLogoDecal,
        hasBackLogo: designs.hasBackLogo,
        logoPosition: designs.logoPosition,
        fullDecal: designs.fullDecal,
        isLogoTexture: designs.isLogoTexture,
        isFullTexture: designs.isFullTexture,
        thumbnail: designs.thumbnail,
        shirtType: designs.shirtType,
        frontTextDecal: designs.frontTextDecal,
        backTextDecal: designs.backTextDecal,
        frontTextData: designs.frontTextData,
        backTextData: designs.backTextData,
        hasFrontText: designs.hasFrontText,
        hasBackText: designs.hasBackText,
      })
      .from(cartItems)
      .innerJoin(designs, eq(cartItems.designId, designs.id))
      .where(eq(cartItems.userId, userId));

    const cartWithUrls = userCart.map((item) => {
      let logoPositions = item.logoPosition;
      if (typeof logoPositions === "string") {
        try {
          logoPositions = JSON.parse(logoPositions);
        } catch (e) {
          logoPositions = ["front"];
        }
      }

      return {
        ...item,
        logoPositions,
        logoPosition: logoPositions,
        thumbnail: toFullUrl(item.thumbnail, req),
        logoDecal: toFullUrl(item.logoDecal, req),
        backLogoDecal: toFullUrl(item.backLogoDecal, req),
        fullDecal: toFullUrl(item.fullDecal, req),
        frontTextDecal: toFullUrl(item.frontTextDecal, req),
        backTextDecal: toFullUrl(item.backTextDecal, req),
      };
    });

    console.log(
      `✅ Fetched ${cartWithUrls.length} cart items for user ${userId}`
    );

    res.json(cartWithUrls);
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

// ADD ITEM TO CART
router.post("/add", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { designId } = req.body;

    if (!designId) {
      return res.status(400).json({ error: "Design ID is required" });
    }

    const design = await db
      .select()
      .from(designs)
      .where(and(eq(designs.id, designId), eq(designs.userId, userId)))
      .limit(1);

    if (design.length === 0) {
      return res.status(404).json({ error: "Design not found" });
    }

    const existingItem = await db
      .select()
      .from(cartItems)
      .where(
        and(eq(cartItems.userId, userId), eq(cartItems.designId, designId))
      )
      .limit(1);

    if (existingItem.length > 0) {
      await db
        .update(cartItems)
        .set({ quantity: existingItem[0].quantity + 1 })
        .where(eq(cartItems.id, existingItem[0].id));

      return res.json({
        message: "Cart updated",
        cartItemId: existingItem[0].id,
      });
    }

    const result = await db.insert(cartItems).values({
      userId,
      designId,
      quantity: 1,
    });

    res.json({ message: "Added to cart", cartItemId: result.insertId });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ error: "Failed to add to cart" });
  }
});

// REMOVE ITEM FROM CART
router.delete("/:cartItemId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const cartItemId = parseInt(req.params.cartItemId);

    await db
      .delete(cartItems)
      .where(and(eq(cartItems.id, cartItemId), eq(cartItems.userId, userId)));

    res.json({ message: "Item removed from cart" });
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ error: "Failed to remove item" });
  }
});

// UPDATE QUANTITY
router.put("/:cartItemId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const cartItemId = parseInt(req.params.cartItemId);
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ error: "Quantity must be at least 1" });
    }

    await db
      .update(cartItems)
      .set({ quantity })
      .where(and(eq(cartItems.id, cartItemId), eq(cartItems.userId, userId)));

    res.json({ message: "Quantity updated" });
  } catch (error) {
    console.error("Error updating quantity:", error);
    res.status(500).json({ error: "Failed to update quantity" });
  }
});

// CHECKOUT - UPDATED with device tracking
router.post("/checkout", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { customerName, customerSurname, phoneNumber, shippingAddress } =
      req.body;

    // Validate customer info
    if (!customerName || !customerSurname || !phoneNumber || !shippingAddress) {
      return res
        .status(400)
        .json({ error: "All customer information is required" });
    }

    // Get device info from request
    const deviceInfo = getDeviceInfo(req);

    console.log("📱 Device info:", deviceInfo);

    // Get user's cart items
    const userCartItems = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.userId, userId));

    if (userCartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Get all design details
    const designIds = userCartItems.map((item) => item.designId);
    const designsData = await db
      .select()
      .from(designs)
      .where(inArray(designs.id, designIds));

    // Get pricing data
    const pricingData = await db.select().from(pricingTable);
    const pricingMap = {};
    pricingData.forEach((item) => {
      pricingMap[item.itemType] = parseFloat(item.price);
    });

    // Create orders with device tracking
    const createdOrders = [];

    for (const cartItem of userCartItems) {
      const design = designsData.find((d) => d.id === cartItem.designId);
      if (!design) continue;

      const unitPrice = calculateOrderPrice(design, pricingMap);
      const totalPrice = unitPrice * cartItem.quantity;

      // Create order WITH device info
      const result = await db.insert(orders).values({
        userId,
        designId: design.id,
        status: "pending",
        customerName,
        customerSurname,
        phoneNumber,
        shippingAddress,
        price: totalPrice.toFixed(2),
        size: design.size,
        orderDate: new Date(),
        // NEW: Device tracking
        deviceType: deviceInfo.deviceType,
        userAgent: deviceInfo.userAgent,
        ipAddress: deviceInfo.ipAddress,
      });

      const orderId = Array.isArray(result)
        ? result[0]?.insertId
        : result.insertId;

      createdOrders.push({
        id: orderId,
        designId: design.id,
        price: totalPrice.toFixed(2),
        quantity: cartItem.quantity,
      });

      console.log(
        `✅ Order ${orderId} created - €${totalPrice.toFixed(2)} from ${
          deviceInfo.deviceType
        }`
      );
    }

    // Clear the cart
    await db.delete(cartItems).where(eq(cartItems.userId, userId));

    // Get user's email
    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Send confirmation email (non-blocking)
    if (user?.email) {
      const orderDetails = {
        items: createdOrders.map((order) => {
          const design = designsData.find((d) => d.id === order.designId);
          return {
            designName: design.name,
            shirtType: design.shirtType,
            quantity: userCartItems.find((c) => c.designId === order.designId)
              .quantity,
            price: order.price,
            isLogoTexture: design.isLogoTexture,
            logoDecal: design.logoDecal,
            hasBackLogo: design.hasBackLogo,
            backLogoDecal: design.backLogoDecal,
            isFullTexture: design.isFullTexture,
            fullDecal: design.fullDecal,
            hasFrontText: design.hasFrontText,
            hasBackText: design.hasBackText,
          };
        }),
        total: createdOrders
          .reduce((sum, o) => sum + parseFloat(o.price), 0)
          .toFixed(2),
        orderDate: new Date(),
        shippingAddress,
      };

      sendOrderConfirmation({
        customerEmail: user.email,
        customerName,
        orderDetails,
      });

      sendAdminNotification({
        customerName: `${customerName} ${customerSurname}`,
        customerEmail: user.email,
        phoneNumber,
        items: orderDetails.items,
        total: orderDetails.total,
      });
    }

    res.json({
      message: "Orders created successfully!",
      orders: createdOrders,
      ordersCreated: createdOrders.length,
    });
  } catch (error) {
    console.error("Error during checkout:", error);
    res.status(500).json({ error: "Failed to process checkout" });
  }
});

// GET USER'S ORDERS
router.get("/orders", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const userOrders = await db
      .select({
        id: orders.id,
        status: orders.status,
        customerName: orders.customerName,
        customerSurname: orders.customerSurname,
        phoneNumber: orders.phoneNumber,
        shippingAddress: orders.shippingAddress,
        price: orders.price,
        orderDate: orders.orderDate,
        shippedDate: orders.shippedDate,
        designName: designs.name,
        designThumbnail: designs.thumbnail,
        shirtType: designs.shirtType,
        color: designs.color,
        logoDecal: designs.logoDecal,
        backLogoDecal: designs.backLogoDecal,
        hasBackLogo: designs.hasBackLogo,
        fullDecal: designs.fullDecal,
        isLogoTexture: designs.isLogoTexture,
        isFullTexture: designs.isFullTexture,
        frontTextDecal: designs.frontTextDecal,
        backTextDecal: designs.backTextDecal,
        hasFrontText: designs.hasFrontText,
        hasBackText: designs.hasBackText,
      })
      .from(orders)
      .innerJoin(designs, eq(orders.designId, designs.id))
      .where(eq(orders.userId, userId))
      .orderBy(orders.orderDate);

    res.json(userOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

export default router;

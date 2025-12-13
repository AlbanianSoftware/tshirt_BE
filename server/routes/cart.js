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

const router = express.Router();

// 🔥 Helper to convert paths to full URLs (SAME AS orders.js)
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

// 🔥 Helper: Calculate price with back logo support
const calculateOrderPrice = (design, pricingData) => {
  const shirtTypeKey = (design.shirtType || "tshirt").toLowerCase();
  let price = pricingData[shirtTypeKey] || 20;

  // Front logo
  if (design.isLogoTexture && design.logoDecal) {
    price += pricingData.logo || 5;
  }

  // 🔥 Back logo (separate charge)
  if (design.hasBackLogo && design.backLogoDecal) {
    price += pricingData.back_logo || pricingData.logo || 5;
  }

  // Full texture
  if (design.isFullTexture && design.fullDecal) {
    price += pricingData.full_texture || 8;
  }

  return price;
};

// 🔥 GET USER'S CART (with back logo data + FIXED URLs)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get cart items with design details
    const userCart = await db
      .select({
        cartItemId: cartItems.id,
        quantity: cartItems.quantity,
        addedAt: cartItems.addedAt,
        designId: designs.id,
        designName: designs.name,
        color: designs.color,
        logoDecal: designs.logoDecal,
        backLogoDecal: designs.backLogoDecal,
        hasBackLogo: designs.hasBackLogo,
        fullDecal: designs.fullDecal,
        isLogoTexture: designs.isLogoTexture,
        isFullTexture: designs.isFullTexture,
        thumbnail: designs.thumbnail,
        shirtType: designs.shirtType,
      })
      .from(cartItems)
      .innerJoin(designs, eq(cartItems.designId, designs.id))
      .where(eq(cartItems.userId, userId));

    // 🔥 FIX: Convert file paths to full URLs
    const cartWithUrls = userCart.map((item) => ({
      ...item,
      thumbnail: toFullUrl(item.thumbnail, req),
      logoDecal: toFullUrl(item.logoDecal, req),
      backLogoDecal: toFullUrl(item.backLogoDecal, req),
      fullDecal: toFullUrl(item.fullDecal, req),
    }));

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

    // Check if design exists and belongs to user
    const design = await db
      .select()
      .from(designs)
      .where(and(eq(designs.id, designId), eq(designs.userId, userId)))
      .limit(1);

    if (design.length === 0) {
      return res.status(404).json({ error: "Design not found" });
    }

    // Check if item already in cart
    const existingItem = await db
      .select()
      .from(cartItems)
      .where(
        and(eq(cartItems.userId, userId), eq(cartItems.designId, designId))
      )
      .limit(1);

    if (existingItem.length > 0) {
      // Update quantity
      await db
        .update(cartItems)
        .set({ quantity: existingItem[0].quantity + 1 })
        .where(eq(cartItems.id, existingItem[0].id));

      return res.json({
        message: "Cart updated",
        cartItemId: existingItem[0].id,
      });
    }

    // Add new item
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

// 🔥 CHECKOUT - Create orders from cart items (with back logo pricing)
// 🔥 CHECKOUT - Create orders from cart items (with back logo pricing)
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

    // 1. Get user's cart items
    const userCartItems = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.userId, userId));

    if (userCartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // 2. Get all design details (including back logo data)
    const designIds = userCartItems.map((item) => item.designId);
    const designsData = await db
      .select()
      .from(designs)
      .where(inArray(designs.id, designIds));

    // 3. Get pricing data
    const pricingData = await db.select().from(pricingTable);
    const pricingMap = {};
    pricingData.forEach((item) => {
      pricingMap[item.itemType] = parseFloat(item.price);
    });

    // 4. Create orders with proper pricing (including back logo)
    const createdOrders = [];

    for (const cartItem of userCartItems) {
      const design = designsData.find((d) => d.id === cartItem.designId);
      if (!design) continue;

      // 🔥 Calculate price INCLUDING back logo
      const unitPrice = calculateOrderPrice(design, pricingMap);
      const totalPrice = unitPrice * cartItem.quantity;

      // Create order
      const result = await db.insert(orders).values({
        userId,
        designId: design.id,
        status: "pending",
        customerName,
        customerSurname,
        phoneNumber,
        shippingAddress,
        price: totalPrice.toFixed(2),
        orderDate: new Date(),
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
        `✅ Order ${orderId} created - ${totalPrice.toFixed(2)} (qty: ${
          cartItem.quantity
        })`
      );

      // Log if back logo is present
      if (design.hasBackLogo && design.backLogoDecal) {
        console.log(
          `   📍 Includes back logo - charged separately (+${
            pricingMap.back_logo || pricingMap.logo || 5
          })`
        );
      }
    }

    // 5. Clear the cart
    await db.delete(cartItems).where(eq(cartItems.userId, userId));

    // 6. Get user's email from database
    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // 7. Send confirmation email (non-blocking)
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
          };
        }),
        total: createdOrders
          .reduce((sum, o) => sum + parseFloat(o.price), 0)
          .toFixed(2),
        orderDate: new Date(),
        shippingAddress,
      };

      // Send emails (don't await - let them run in background)
      sendOrderConfirmation({
        customerEmail: user.email,
        customerName,
        orderDetails,
      });

      // Optional: Send yourself a notification
      sendAdminNotification({
        customerName: `${customerName} ${customerSurname}`,
        customerEmail: user.email,
        phoneNumber,
        items: orderDetails.items,
        total: orderDetails.total,
      });
    }

    // 8. Send response (ONLY ONE res.json() call)
    res.json({
      message: "Orders created successfully! 🎉",
      orders: createdOrders,
      ordersCreated: createdOrders.length,
    });
  } catch (error) {
    console.error("Error during checkout:", error);
    res.status(500).json({ error: "Failed to process checkout" });
  }
});

// 🔥 GET USER'S ORDERS (with back logo data)
router.get("/orders", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get orders with design data via JOIN
    const userOrders = await db
      .select({
        // Order fields
        id: orders.id,
        status: orders.status,
        customerName: orders.customerName,
        customerSurname: orders.customerSurname,
        phoneNumber: orders.phoneNumber,
        shippingAddress: orders.shippingAddress,
        price: orders.price,
        orderDate: orders.orderDate,
        shippedDate: orders.shippedDate,

        // Design fields
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

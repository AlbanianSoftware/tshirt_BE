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
  countries,
  cities,
} from "../db/schema.js";
import { eq, and, inArray } from "drizzle-orm";
import { authenticateToken } from "../middleware/auth.js";
import { getDeviceInfo } from "../utils/deviceUtils.js";

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
// Place order from cart (UPDATED with new shipping structure)
// Replace your checkout route in server/routes/cart.js with this:

// Replace your checkout route in server/routes/cart.js with this:

router.post("/checkout", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user.sub;
    const {
      customerName,
      customerSurname,
      phoneNumber,
      countryId,
      cityId,
      detailedAddress,
    } = req.body;

    console.log("🛒 Starting checkout for user:", userId);

    // Validation
    if (!customerName || !customerSurname || !phoneNumber) {
      return res.status(400).json({ error: "Customer information required" });
    }

    if (!countryId || !cityId || !detailedAddress) {
      return res
        .status(400)
        .json({ error: "Complete shipping address required" });
    }

    // Verify country and city exist
    const [country] = await db
      .select()
      .from(countries)
      .where(eq(countries.id, parseInt(countryId)));

    const [city] = await db
      .select()
      .from(cities)
      .where(eq(cities.id, parseInt(cityId)));

    if (!country || !city) {
      return res.status(400).json({ error: "Invalid shipping location" });
    }

    console.log(`📍 Shipping to: ${city.name}, ${country.name}`);

    // Get cart items with design details
    const userCartItems = await db
      .select({
        cartItemId: cartItems.id,
        designId: cartItems.designId,
        quantity: cartItems.quantity,
        design: designs,
      })
      .from(cartItems)
      .innerJoin(designs, eq(cartItems.designId, designs.id))
      .where(eq(cartItems.userId, userId));

    if (userCartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    console.log(`📦 Cart has ${userCartItems.length} items`);

    // Get pricing
    const pricingData = await db.select().from(pricingTable);
    const pricingMap = {};
    pricingData.forEach((item) => {
      pricingMap[item.itemType] = parseFloat(item.price);
    });

    console.log("💰 Pricing data:", pricingMap);

    // Device detection
    const userAgent = req.headers["user-agent"] || "";
    const deviceType = /mobile/i.test(userAgent)
      ? "mobile"
      : /tablet/i.test(userAgent)
      ? "tablet"
      : "desktop";
    const ipAddress =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    // Get user email for notifications
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    // Create orders for each cart item
    const createdOrders = [];
    let grandTotal = 0;

    for (const item of userCartItems) {
      const design = item.design;

      // Calculate base price based on shirt type
      const shirtTypeKey = (design.shirtType || "tshirt").toLowerCase();
      let itemPrice = pricingMap[shirtTypeKey] || pricingMap.tshirt || 20;

      console.log(`👕 Base price for ${shirtTypeKey}: €${itemPrice}`);

      // Add logo price (front)
      if (design.isLogoTexture && design.logoDecal) {
        const logoPrice = pricingMap.logo || 5;
        itemPrice += logoPrice;
        console.log(`🎨 + Front logo: €${logoPrice}`);
      }

      // Add back logo price
      const hasDedicatedBackLogo =
        design.backLogoDecal && design.backLogoDecal.trim() !== "";
      const hasFrontLogoOnBack =
        design.hasBackLogo && !hasDedicatedBackLogo && design.logoDecal;

      if (hasDedicatedBackLogo || hasFrontLogoOnBack) {
        const backLogoPrice = pricingMap.back_logo || pricingMap.logo || 5;
        itemPrice += backLogoPrice;
        console.log(`🎨 + Back logo: €${backLogoPrice}`);
      }

      // Add texture price
      if (design.isFullTexture && design.fullDecal) {
        const texturePrice = pricingMap.full_texture || 8;
        itemPrice += texturePrice;
        console.log(`🌈 + Full texture: €${texturePrice}`);
      }

      // Add front text price
      if (
        (design.frontTextDecal && design.frontTextDecal.trim() !== "") ||
        design.hasFrontText
      ) {
        const frontTextPrice = pricingMap.front_text || pricingMap.text || 2;
        itemPrice += frontTextPrice;
        console.log(`📝 + Front text: €${frontTextPrice}`);
      }

      // Add back text price
      if (
        (design.backTextDecal && design.backTextDecal.trim() !== "") ||
        design.hasBackText
      ) {
        const backTextPrice = pricingMap.back_text || pricingMap.text || 2;
        itemPrice += backTextPrice;
        console.log(`📝 + Back text: €${backTextPrice}`);
      }

      // Multiply by quantity
      const totalPrice = itemPrice * item.quantity;
      grandTotal += totalPrice;

      console.log(
        `✅ Item total: €${itemPrice} × ${item.quantity} = €${totalPrice}`
      );

      // Create legacy shippingAddress for backward compatibility
      const legacyAddress = `${detailedAddress}\n${city.name}, ${country.name}`;

      const [orderResult] = await db.insert(orders).values({
        userId,
        designId: design.id,
        size: design.size,
        customerName,
        customerSurname,
        phoneNumber,
        countryId: parseInt(countryId),
        cityId: parseInt(cityId),
        detailedAddress,
        shippingAddress: legacyAddress,
        price: totalPrice.toFixed(2),
        status: "pending",
        deviceType,
        userAgent,
        ipAddress,
        frontTextDecal: design.frontTextDecal,
        backTextDecal: design.backTextDecal,
        frontTextData: design.frontTextData,
        backTextData: design.backTextData,
      });

      createdOrders.push({
        orderId: orderResult.insertId,
        designName: design.name,
        price: totalPrice.toFixed(2),
        quantity: item.quantity,
      });
    }

    console.log(`💵 Grand total: €${grandTotal.toFixed(2)}`);

    // Clear cart
    await db.delete(cartItems).where(eq(cartItems.userId, userId));

    // Send email notifications
    try {
      console.log("📧 Sending email notifications...");

      if (user && user.email) {
        // Format items for email
        const emailItems = await Promise.all(
          createdOrders.map(async (order) => {
            const [design] = await db
              .select()
              .from(designs)
              .where(
                eq(
                  designs.id,
                  userCartItems.find((i) => i.designId === order.designId)
                    ?.designId
                )
              );

            return {
              designName: order.designName || design?.name || "Custom Design",
              quantity: order.quantity,
              price: order.price,
              shirtType: design?.shirtType || "T-Shirt",
              isLogoTexture: design?.isLogoTexture,
              logoDecal: design?.logoDecal,
              hasBackLogo: design?.hasBackLogo,
              backLogoDecal: design?.backLogoDecal,
              isFullTexture: design?.isFullTexture,
              fullDecal: design?.fullDecal,
            };
          })
        );

        await sendOrderConfirmation({
          customerEmail: user.email,
          customerName: `${customerName} ${customerSurname}`,
          orderDetails: {
            items: emailItems,
            total: grandTotal.toFixed(2),
            orderDate: new Date(),
            shippingAddress: `${detailedAddress}\n${city.name}, ${country.name}`,
          },
        });
        console.log("✅ Customer email sent to:", user.email);
      }

      await sendAdminNotification({
        customerName: `${customerName} ${customerSurname}`,
        customerEmail: user?.email || "No email provided",
        phoneNumber,
        items: createdOrders,
        total: grandTotal.toFixed(2),
      });
      console.log("✅ Admin notification sent");
    } catch (emailError) {
      console.error("❌ Email error:", emailError);
      // Don't fail the order if email fails
    }

    console.log(
      `✅ Order placed: ${userCartItems.length} items for user ${userId}`
    );

    res.json({
      message: "Order placed successfully",
      orderCount: createdOrders.length,
      total: grandTotal.toFixed(2),
    });
  } catch (error) {
    console.error("❌ Error placing order:", error);
    res.status(500).json({ error: "Failed to place order" });
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

import express from "express";
import { db } from "../db/index.js";
import { cartItems, designs } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Get user's cart
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

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
        fullDecal: designs.fullDecal,
        isLogoTexture: designs.isLogoTexture,
        isFullTexture: designs.isFullTexture,
        thumbnail: designs.thumbnail,
      })
      .from(cartItems)
      .innerJoin(designs, eq(cartItems.designId, designs.id))
      .where(eq(cartItems.userId, userId));

    res.json(userCart);
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

// Add item to cart
router.post("/add", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
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

// Remove item from cart
router.delete("/:cartItemId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
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

// Update quantity
router.put("/:cartItemId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
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

// Checkout (clear cart after "purchase")
router.post("/checkout", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get cart items before clearing
    const userCart = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.userId, userId));

    if (userCart.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Clear the cart
    await db.delete(cartItems).where(eq(cartItems.userId, userId));

    res.json({
      message: "Payment successful! Your designs are on the way! 🎉",
      itemsPurchased: userCart.length,
    });
  } catch (error) {
    console.error("Error during checkout:", error);
    res.status(500).json({ error: "Failed to process checkout" });
  }
});

export default router;

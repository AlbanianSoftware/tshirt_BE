import express from "express";
import { db } from "../db/index.js";
import { orders, designs } from "../db/schema.js";
import { eq, sql, desc } from "drizzle-orm";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

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
    const [newOrder] = await db.insert(orders).values({
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

    res.status(201).json({
      message: "Order created successfully",
      orderId: newOrder.insertId,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user's orders
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
      })
      .from(orders)
      .leftJoin(designs, eq(orders.designId, designs.id))
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.orderDate));

    res.json(userOrders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

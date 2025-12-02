// server/routes/admin.js
import express from "express";
import { db } from "../db/index.js";
import { users, designs, orders } from "../db/schema.js";
import { eq, sql } from "drizzle-orm";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    // Check different possible JWT payload structures
    const userId = req.user.userId || req.user.id || req.user.sub;

    console.log("🔍 Full req.user object:", req.user);
    console.log("🔍 Extracted userId:", userId);

    if (!userId) {
      console.log("❌ No userId found in token");
      return res.status(403).json({ message: "Invalid token structure" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));

    console.log("👤 User found:", user);
    console.log("🔐 isAdmin status:", user?.isAdmin);

    if (!user) {
      console.log("❌ User not found in database");
      return res.status(403).json({ message: "User not found" });
    }

    if (!user.isAdmin) {
      console.log("❌ User is not an admin");
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    console.log("✅ Admin access granted");
    next();
  } catch (error) {
    console.error("Admin check error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Apply auth middleware to all admin routes
router.use(authenticateToken);
router.use(isAdmin);

// Get all orders with customer and design details
router.get("/orders", async (req, res) => {
  try {
    const allOrders = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        designId: orders.designId,
        status: orders.status,
        customerName: orders.customerName,
        customerSurname: orders.customerSurname,
        phoneNumber: orders.phoneNumber,
        shippingAddress: orders.shippingAddress,
        orderDate: orders.orderDate,
        shippedDate: orders.shippedDate,
        price: orders.price,
        createdAt: orders.createdAt,
        username: users.username,
        userEmail: users.email,
        designName: designs.name,
        designThumbnail: designs.thumbnail,
        designColor: designs.color,
        shirtType: designs.shirtType,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(designs, eq(orders.designId, designs.id))
      .orderBy(sql`${orders.orderDate} DESC`);

    res.json(allOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single order details
router.get("/orders/:id", async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);

    const [order] = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        designId: orders.designId,
        status: orders.status,
        customerName: orders.customerName,
        customerSurname: orders.customerSurname,
        phoneNumber: orders.phoneNumber,
        shippingAddress: orders.shippingAddress,
        orderDate: orders.orderDate,
        shippedDate: orders.shippedDate,
        price: orders.price,
        createdAt: orders.createdAt,
        username: users.username,
        userEmail: users.email,
        designName: designs.name,
        designThumbnail: designs.thumbnail,
        designColor: designs.color,
        shirtType: designs.shirtType,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(designs, eq(orders.designId, designs.id))
      .where(eq(orders.id, orderId));

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
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

    // Validate status
    const validStatuses = ["pending", "processing", "shipped", "delivered"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Update shipped date if status is changed to 'shipped'
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

export default router;

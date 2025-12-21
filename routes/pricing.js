import express from "express";
import { db } from "../db/index.js";
import { pricing } from "../db/schema.js";
import { eq } from "drizzle-orm";

const router = express.Router();

// Get all active pricing (public endpoint - no auth needed)
router.get("/", async (req, res) => {
  try {
    const activePricing = await db
      .select()
      .from(pricing)
      .where(eq(pricing.isActive, true));

    // Convert to object format for easier frontend use
    const pricingObj = activePricing.reduce((acc, item) => {
      acc[item.itemType] = parseFloat(item.price);
      return acc;
    }, {});

    res.json(pricingObj);
  } catch (error) {
    console.error("Error fetching pricing:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

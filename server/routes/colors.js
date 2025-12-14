import express from "express";
import { db } from "../db/index.js";
import { colors } from "../db/schema.js";
import { eq } from "drizzle-orm";

const router = express.Router();

// 🔥 PUBLIC: Get all active colors (for ColorPicker)
router.get("/", async (req, res) => {
  try {
    const activeColors = await db
      .select()
      .from(colors)
      .where(eq(colors.isActive, true))
      .orderBy(colors.sortOrder);

    res.json(activeColors);
  } catch (error) {
    console.error("Error fetching colors:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

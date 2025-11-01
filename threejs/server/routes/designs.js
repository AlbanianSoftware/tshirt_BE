// routes/designs.js
import express from "express";
import jwt from "jsonwebtoken";
import { db } from "../db/index.js";
import { designs } from "../db/schema.js";
import { eq, and, desc } from "drizzle-orm";

const router = express.Router();
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Middleware to check JWT authentication
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ error: "No token provided. Please log in." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.userId };
    console.log("✅ Authenticated user:", req.user.id);
    next();
  } catch (error) {
    console.error("❌ Auth error:", error.message);
    return res
      .status(401)
      .json({ error: "Invalid token. Please log in again." });
  }
};

// Save a new design
router.post("/", authenticate, async (req, res) => {
  try {
    console.log("💾 Saving design for user:", req.user.id);
    const {
      name,
      color,
      shirtType, // NEW FIELD
      logoDecal,
      fullDecal,
      isLogoTexture,
      isFullTexture,
      textData,
      thumbnail,
    } = req.body;

    console.log("Design data:", {
      name,
      color,
      shirtType,
      hasLogo: !!logoDecal,
      hasFull: !!fullDecal,
    });

    if (!name || !color) {
      console.log("❌ Validation failed: missing name or color");
      return res.status(400).json({ error: "Name and color are required" });
    }

    const newDesign = await db.insert(designs).values({
      userId: req.user.id,
      name,
      color,
      shirtType: shirtType || "tshirt", // Default to tshirt
      logoDecal: logoDecal || null,
      fullDecal: fullDecal || null,
      isLogoTexture: isLogoTexture || false,
      isFullTexture: isFullTexture || false,
      textData: textData ? JSON.stringify(textData) : null,
      thumbnail: thumbnail || null,
    });

    console.log("✅ Design saved successfully, ID:", newDesign.insertId);

    res.status(201).json({
      message: "Design saved successfully",
      designId: newDesign.insertId,
    });
  } catch (error) {
    console.error("❌ Error saving design:", error);
    res
      .status(500)
      .json({ error: "Failed to save design", details: error.message });
  }
});

// Get all designs for the logged-in user
router.get("/", authenticate, async (req, res) => {
  try {
    console.log("📋 Fetching designs for user:", req.user.id);

    const userDesigns = await db
      .select()
      .from(designs)
      .where(eq(designs.userId, req.user.id))
      .orderBy(desc(designs.updatedAt));

    console.log("✅ Found designs:", userDesigns.length);

    // Parse textData JSON for each design
    const parsedDesigns = userDesigns.map((design) => ({
      ...design,
      textData: design.textData ? JSON.parse(design.textData) : null,
    }));

    res.json(parsedDesigns);
  } catch (error) {
    console.error("❌ Error fetching designs:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch designs", details: error.message });
  }
});

// Get a specific design by ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    const designId = parseInt(req.params.id);

    const [design] = await db
      .select()
      .from(designs)
      .where(and(eq(designs.id, designId), eq(designs.userId, req.user.id)));

    if (!design) {
      return res.status(404).json({ error: "Design not found" });
    }

    // Parse textData JSON
    const parsedDesign = {
      ...design,
      textData: design.textData ? JSON.parse(design.textData) : null,
    };

    res.json(parsedDesign);
  } catch (error) {
    console.error("Error fetching design:", error);
    res.status(500).json({ error: "Failed to fetch design" });
  }
});

// Update an existing design
router.put("/:id", authenticate, async (req, res) => {
  try {
    const designId = parseInt(req.params.id);
    const {
      name,
      color,
      shirtType, // NEW FIELD
      logoDecal,
      fullDecal,
      isLogoTexture,
      isFullTexture,
      textData,
      thumbnail,
    } = req.body;

    // Verify ownership
    const [existing] = await db
      .select()
      .from(designs)
      .where(and(eq(designs.id, designId), eq(designs.userId, req.user.id)));

    if (!existing) {
      return res.status(404).json({ error: "Design not found" });
    }

    await db
      .update(designs)
      .set({
        name: name || existing.name,
        color: color || existing.color,
        shirtType: shirtType || existing.shirtType, // NEW FIELD
        logoDecal: logoDecal !== undefined ? logoDecal : existing.logoDecal,
        fullDecal: fullDecal !== undefined ? fullDecal : existing.fullDecal,
        isLogoTexture:
          isLogoTexture !== undefined ? isLogoTexture : existing.isLogoTexture,
        isFullTexture:
          isFullTexture !== undefined ? isFullTexture : existing.isFullTexture,
        textData: textData ? JSON.stringify(textData) : existing.textData,
        thumbnail: thumbnail !== undefined ? thumbnail : existing.thumbnail,
      })
      .where(eq(designs.id, designId));

    res.json({ message: "Design updated successfully" });
  } catch (error) {
    console.error("Error updating design:", error);
    res.status(500).json({ error: "Failed to update design" });
  }
});

// Delete a design
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const designId = parseInt(req.params.id);

    // Verify ownership before deleting
    const [existing] = await db
      .select()
      .from(designs)
      .where(and(eq(designs.id, designId), eq(designs.userId, req.user.id)));

    if (!existing) {
      return res.status(404).json({ error: "Design not found" });
    }

    await db.delete(designs).where(eq(designs.id, designId));

    res.json({ message: "Design deleted successfully" });
  } catch (error) {
    console.error("Error deleting design:", error);
    res.status(500).json({ error: "Failed to delete design" });
  }
});

export default router;

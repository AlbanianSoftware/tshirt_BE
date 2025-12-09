// routes/designs.js - FIXED TO USE COOKIE AUTH
import express from "express";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { db } from "../db/index.js";
import { designs } from "../db/schema.js";
import { eq, and, desc, like, sql } from "drizzle-orm";
import { authenticateToken } from "../middleware/auth.js"; // 🔥 USE COOKIE AUTH MIDDLEWARE

const router = express.Router();

// 🔥 FIXED: Save and compress images - NOW HANDLES FULL URLs!
const saveAndCompressImage = async (base64String, type, userId, designId) => {
  if (!base64String) return null;

  try {
    let buffer;
    let isDefault = false;
    let filePath = base64String;

    // 🔥 NEW: Extract path from full URL if needed
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      try {
        const url = new URL(filePath);
        filePath = url.pathname; // Extract "/defaults/albania.png" from full URL
        console.log(`🔗 Extracted path from URL: ${filePath}`);
      } catch (error) {
        console.error("❌ Invalid URL:", filePath);
        return null;
      }
    }

    // Handle base64 data
    if (filePath.startsWith("data:image")) {
      const matches = filePath.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!matches) return null;
      buffer = Buffer.from(matches[2], "base64");
      console.log(`📸 Processing base64 image for ${type}`);
    }
    // Handle default asset paths (e.g., "/defaults/albania.png")
    else if (filePath.startsWith("/defaults/")) {
      // 🔥 FIX: Just return the path for default assets - don't copy them!
      console.log(`✅ Using default asset: ${filePath}`);
      return filePath;
    }
    // Handle paths starting with "/" (but not defaults)
    else if (filePath.startsWith("/") && !filePath.startsWith("/uploads")) {
      const defaultPath = path.join(process.cwd(), "public", filePath);
      if (fs.existsSync(defaultPath)) {
        buffer = fs.readFileSync(defaultPath);
        isDefault = true;
        console.log(`📋 Copying asset: ${filePath}`);
      } else {
        console.error(`❌ Asset not found: ${defaultPath}`);
        return null;
      }
    }
    // Already a saved path - return as is
    else if (filePath.startsWith("/uploads")) {
      console.log(`✅ Already uploaded: ${filePath}`);
      return filePath;
    } else {
      console.error(`❌ Unknown path format: ${filePath}`);
      return null;
    }

    // If we got here and buffer is null, something went wrong
    if (!buffer) {
      console.error(`❌ No buffer created for ${type}`);
      return null;
    }

    // Determine folder and compression settings based on type
    let folder, maxSize, quality, format;

    if (type === "thumb") {
      folder = "thumbnails";
      maxSize = 400;
      quality = 80;
      format = "jpeg";
    } else if (type === "logo") {
      folder = isDefault ? "defaults" : "logos";
      maxSize = 1024;
      quality = 90;
      format = "png";
    } else if (type === "texture") {
      folder = "textures";
      maxSize = 2048;
      quality = 85;
      format = "jpeg";
    } else {
      return null;
    }

    // Create directory if doesn't exist
    const uploadDir = path.join(process.cwd(), "public/uploads", folder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log(`📁 Created directory: /uploads/${folder}`);
    }

    // Generate proper filename
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const filename = `${userId}_${timestamp}_${type}_${random}.${format}`;
    const filepath = path.join(uploadDir, filename);

    // Compress and save using Sharp
    let sharpInstance = sharp(buffer);

    const metadata = await sharpInstance.metadata();
    if (metadata.width > maxSize || metadata.height > maxSize) {
      sharpInstance = sharpInstance.resize(maxSize, maxSize, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    if (format === "jpeg") {
      await sharpInstance.jpeg({ quality }).toFile(filepath);
    } else if (format === "png") {
      await sharpInstance
        .png({ quality, compressionLevel: 9 })
        .toFile(filepath);
    }

    const stats = fs.statSync(filepath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`✅ Saved ${type}: ${filename} (${sizeKB}KB)`);

    return `/uploads/${folder}/${filename}`;
  } catch (error) {
    console.error(`❌ Error saving ${type}:`, error);
    return null;
  }
};

// Helper function to delete file
const deleteFile = (filePath) => {
  if (!filePath || !filePath.startsWith("/uploads/")) return;

  try {
    const fullPath = path.join(process.cwd(), "public", filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`🗑️ Deleted file: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error deleting file ${filePath}:`, error);
  }
};

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

// Save a new design
router.post("/", authenticateToken, async (req, res) => {
  try {
    console.log("💾 Saving design for user:", req.user.userId);
    const {
      name,
      color,
      shirtType,
      logoDecal,
      fullDecal,
      isLogoTexture,
      isFullTexture,
      textData,
      logo,
      logoPosition,
      thumbnail,
    } = req.body;

    console.log("📦 Received data:", {
      name,
      logoDecal: logoDecal?.substring(0, 100),
      fullDecal: fullDecal?.substring(0, 100),
      isLogoTexture,
      isFullTexture,
    });

    if (!name || !color) {
      return res.status(400).json({ error: "Name and color are required" });
    }

    // Insert to get design ID
    const result = await db.insert(designs).values({
      userId: req.user.userId,
      name,
      color,
      shirtType: shirtType || "tshirt",
      logoDecal: null,
      fullDecal: null,
      isLogoTexture: isLogoTexture || false,
      isFullTexture: isFullTexture || false,
      textData: textData ? JSON.stringify(textData) : null,
      logoData: logo ? JSON.stringify(logo) : null,
      logoPosition: logoPosition
        ? JSON.stringify(logoPosition)
        : JSON.stringify(["front"]),
      thumbnail: null,
    });

    const designId = Array.isArray(result)
      ? result[0]?.insertId
      : result.insertId;

    if (!designId) {
      throw new Error("Failed to get design ID");
    }

    console.log("✅ Design inserted with ID:", designId);

    // Save and compress files - NOW HANDLES FULL URLs!
    const logoPath = await saveAndCompressImage(
      logoDecal,
      "logo",
      req.user.userId,
      designId
    );
    const fullPath = await saveAndCompressImage(
      fullDecal,
      "texture",
      req.user.userId,
      designId
    );
    const thumbPath = await saveAndCompressImage(
      thumbnail,
      "thumb",
      req.user.userId,
      designId
    );

    console.log("📁 Files processed:", { logoPath, fullPath, thumbPath });

    // Update with file paths
    await db
      .update(designs)
      .set({
        logoDecal: logoPath,
        fullDecal: fullPath,
        thumbnail: thumbPath,
      })
      .where(eq(designs.id, designId));

    res.status(201).json({
      message: "Design saved successfully",
      designId: designId,
    });
  } catch (error) {
    console.error("❌ Error saving design:", error);
    res
      .status(500)
      .json({ error: "Failed to save design", details: error.message });
  }
});

// Get all designs
router.get("/", authenticateToken, async (req, res) => {
  try {
    console.log("📥 Fetching designs for user:", req.user.userId);
    const { search, limit = 12, offset = 0, shirtType } = req.query;
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);

    const conditions = [eq(designs.userId, req.user.userId)];
    if (search) conditions.push(like(designs.name, `%${search}%`));
    if (shirtType && shirtType !== "all")
      conditions.push(eq(designs.shirtType, shirtType));

    const [{ count: totalCount }] = await db
      .select({ count: sql`count(*)` })
      .from(designs)
      .where(and(...conditions));

    const userDesigns = await db
      .select()
      .from(designs)
      .where(and(...conditions))
      .orderBy(desc(designs.updatedAt))
      .limit(limitNum)
      .offset(offsetNum);

    const parsedDesigns = userDesigns.map((design) => ({
      ...design,
      textData: design.textData ? JSON.parse(design.textData) : null,
      logo: design.logoData ? JSON.parse(design.logoData) : null,
      logoPosition: design.logoPosition
        ? JSON.parse(design.logoPosition)
        : ["front"],
      thumbnail: toFullUrl(design.thumbnail, req),
      logoDecal: toFullUrl(design.logoDecal, req),
      fullDecal: toFullUrl(design.fullDecal, req),
    }));

    console.log(
      `✅ Found ${parsedDesigns.length} designs for user ${req.user.userId}`
    );

    res.json({
      designs: parsedDesigns,
      total: Number(totalCount),
      limit: limitNum,
      offset: offsetNum,
    });
  } catch (error) {
    console.error("❌ Error fetching designs:", error);
    res.status(500).json({ error: "Failed to fetch designs" });
  }
});

// Get specific design
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const designId = parseInt(req.params.id);
    const [design] = await db
      .select()
      .from(designs)
      .where(
        and(eq(designs.id, designId), eq(designs.userId, req.user.userId))
      );

    if (!design) {
      return res.status(404).json({ error: "Design not found" });
    }

    res.json({
      ...design,
      textData: design.textData ? JSON.parse(design.textData) : null,
      logo: design.logoData ? JSON.parse(design.logoData) : null,
      logoPosition: design.logoPosition
        ? JSON.parse(design.logoPosition)
        : ["front"],
      thumbnail: toFullUrl(design.thumbnail, req),
      logoDecal: toFullUrl(design.logoDecal, req),
      fullDecal: toFullUrl(design.fullDecal, req),
    });
  } catch (error) {
    console.error("Error fetching design:", error);
    res.status(500).json({ error: "Failed to fetch design" });
  }
});

// Update design
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const designId = parseInt(req.params.id);
    const {
      name,
      color,
      shirtType,
      logoDecal,
      fullDecal,
      isLogoTexture,
      isFullTexture,
      textData,
      logo,
      logoPosition,
      thumbnail,
    } = req.body;

    const [existing] = await db
      .select()
      .from(designs)
      .where(
        and(eq(designs.id, designId), eq(designs.userId, req.user.userId))
      );

    if (!existing) {
      return res.status(404).json({ error: "Design not found" });
    }

    let newLogoPath = existing.logoDecal;
    let newFullPath = existing.fullDecal;
    let newThumbPath = existing.thumbnail;

    // Update files if new data provided
    if (logoDecal) {
      deleteFile(existing.logoDecal);
      newLogoPath = await saveAndCompressImage(
        logoDecal,
        "logo",
        req.user.userId,
        designId
      );
    }

    if (fullDecal) {
      deleteFile(existing.fullDecal);
      newFullPath = await saveAndCompressImage(
        fullDecal,
        "texture",
        req.user.userId,
        designId
      );
    }

    if (thumbnail && thumbnail.startsWith("data:image")) {
      deleteFile(existing.thumbnail);
      newThumbPath = await saveAndCompressImage(
        thumbnail,
        "thumb",
        req.user.userId,
        designId
      );
    }

    await db
      .update(designs)
      .set({
        name: name || existing.name,
        color: color || existing.color,
        shirtType: shirtType || existing.shirtType,
        logoDecal: newLogoPath,
        fullDecal: newFullPath,
        isLogoTexture:
          isLogoTexture !== undefined ? isLogoTexture : existing.isLogoTexture,
        isFullTexture:
          isFullTexture !== undefined ? isFullTexture : existing.isFullTexture,
        textData: textData ? JSON.stringify(textData) : existing.textData,
        logoData: logo ? JSON.stringify(logo) : existing.logoData,
        logoPosition: logoPosition
          ? JSON.stringify(logoPosition)
          : existing.logoPosition,
        thumbnail: newThumbPath,
      })
      .where(eq(designs.id, designId));

    res.json({ message: "Design updated successfully" });
  } catch (error) {
    console.error("Error updating design:", error);
    res.status(500).json({ error: "Failed to update design" });
  }
});

// Delete design
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const designId = parseInt(req.params.id);
    const [existing] = await db
      .select()
      .from(designs)
      .where(
        and(eq(designs.id, designId), eq(designs.userId, req.user.userId))
      );

    if (!existing) {
      return res.status(404).json({ error: "Design not found" });
    }

    deleteFile(existing.logoDecal);
    deleteFile(existing.fullDecal);
    deleteFile(existing.thumbnail);

    await db.delete(designs).where(eq(designs.id, designId));

    res.json({ message: "Design deleted successfully" });
  } catch (error) {
    console.error("Error deleting design:", error);
    res.status(500).json({ error: "Failed to delete design" });
  }
});

export default router;

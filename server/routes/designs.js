import express from "express";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { db } from "../db/index.js";
import { designs } from "../db/schema.js";
import { eq, and, desc, like, sql } from "drizzle-orm";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// 🔥 OPTIMIZED: Image compression configs (SINGLE DEFINITION WITH TEXT SUPPORT)
const IMAGE_CONFIGS = {
  thumb: { folder: "thumbnails", maxSize: 400, quality: 80, format: "jpeg" },
  logo: { folder: "logos", maxSize: 1024, quality: 90, format: "png" },
  backLogo: { folder: "logos", maxSize: 1024, quality: 90, format: "png" },
  texture: { folder: "textures", maxSize: 2048, quality: 85, format: "jpeg" },
  text: { folder: "text", maxSize: 1024, quality: 90, format: "png" }, // 🆕 TEXT SUPPORT
};

// 🔥 OPTIMIZED: Save and compress images
const saveAndCompressImage = async (base64String, type, userId, designId) => {
  if (!base64String) return null;

  try {
    let buffer;
    let filePath = base64String;

    // Extract path from URL
    if (filePath.startsWith("http")) {
      filePath = new URL(filePath).pathname;
    }

    // Handle different input types
    if (filePath.startsWith("data:image")) {
      const matches = filePath.match(/^data:image\/\w+;base64,(.+)$/);
      if (!matches) return null;
      buffer = Buffer.from(matches[1], "base64");
    } else if (filePath.startsWith("/defaults/")) {
      return filePath; // Use default asset
    } else if (filePath.startsWith("/uploads")) {
      return filePath; // Already uploaded
    } else if (filePath.startsWith("/")) {
      const defaultPath = path.join(process.cwd(), "public", filePath);
      if (fs.existsSync(defaultPath)) {
        buffer = fs.readFileSync(defaultPath);
      } else {
        return null;
      }
    } else {
      return null;
    }

    if (!buffer) return null;

    // Get config for this type
    const config = IMAGE_CONFIGS[type];
    if (!config) return null;

    // Create directory
    const uploadDir = path.join(process.cwd(), "public/uploads", config.folder);
    fs.mkdirSync(uploadDir, { recursive: true });

    // Generate filename
    const filename = `${userId}_${Date.now()}_${type}_${Math.floor(
      Math.random() * 1000
    )}.${config.format}`;
    const filepath = path.join(uploadDir, filename);

    // Compress and save
    let sharpInstance = sharp(buffer).resize(config.maxSize, config.maxSize, {
      fit: "inside",
      withoutEnlargement: true,
    });

    if (config.format === "jpeg") {
      await sharpInstance.jpeg({ quality: config.quality }).toFile(filepath);
    } else {
      await sharpInstance
        .png({ quality: config.quality, compressionLevel: 9 })
        .toFile(filepath);
    }

    console.log(`✅ Saved ${type}: ${filename}`);
    return `/uploads/${config.folder}/${filename}`;
  } catch (error) {
    console.error(`❌ Error saving ${type}:`, error);
    return null;
  }
};

// 🔥 OPTIMIZED: Delete file
const deleteFile = (filePath) => {
  if (!filePath?.startsWith("/uploads/")) return;
  try {
    const fullPath = path.join(process.cwd(), "public", filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`🗑️ Deleted: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Delete error:`, error);
  }
};

// 🔥 OPTIMIZED: Convert to full URL
const toFullUrl = (path, req) => {
  if (!path || path.startsWith("http") || path.startsWith("data:image"))
    return path;
  if (path.startsWith("/")) {
    const baseUrl =
      process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
    return `${baseUrl}${path}`;
  }
  return path;
};

// 🔥 OPTIMIZED: Parse design data
const parseDesign = (design, req) => ({
  ...design,
  textData: design.textData ? JSON.parse(design.textData) : null,
  logo: design.logoData ? JSON.parse(design.logoData) : null,
  logoPosition: design.logoPosition
    ? JSON.parse(design.logoPosition)
    : ["front"],
  backLogoPosition: design.backLogoPosition
    ? JSON.parse(design.backLogoPosition)
    : null,
  thumbnail: toFullUrl(design.thumbnail, req),
  logoDecal: toFullUrl(design.logoDecal, req),
  backLogoDecal: toFullUrl(design.backLogoDecal, req),
  fullDecal: toFullUrl(design.fullDecal, req),
  frontTextDecal: toFullUrl(design.frontTextDecal, req), // 🆕
  backTextDecal: toFullUrl(design.backTextDecal, req), // 🆕
  frontTextData: design.frontTextData ? JSON.parse(design.frontTextData) : null, // 🆕
  backTextData: design.backTextData ? JSON.parse(design.backTextData) : null, // 🆕
});

// 🔥 SAVE NEW DESIGN
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      name,
      color,
      shirtType,
      size,
      logoDecal,
      backLogoDecal,
      fullDecal,
      isLogoTexture,
      isFullTexture,
      textData, // Legacy
      logo,
      logoPosition,
      backLogoPosition,
      thumbnail,
      // 🆕 NEW TEXT FIELDS
      frontTextDecal,
      backTextDecal,
      frontText,
      backText,
    } = req.body;

    if (!name || !color) {
      return res.status(400).json({ error: "Name and color are required" });
    }

    const positions = Array.isArray(logoPosition)
      ? logoPosition
      : logoPosition
      ? [logoPosition]
      : ["front"];

    const hasFrontLogoOnBack =
      positions.includes("back") && isLogoTexture && !!logoDecal;
    const hasDedicatedBackLogo = !!backLogoDecal;
    const shouldSetBackLogoFlag = hasFrontLogoOnBack || hasDedicatedBackLogo;

    // 🆕 Check if text exists
    const hasFrontTextContent = frontText?.content?.trim() || frontTextDecal;
    const hasBackTextContent = backText?.content?.trim() || backTextDecal;

    console.log("🔍 Text Save Debug:", {
      hasFrontTextContent,
      hasBackTextContent,
      frontText,
      backText,
    });

    // Insert design
    const result = await db.insert(designs).values({
      userId: req.user.userId,
      name,
      color,
      shirtType: shirtType || "tshirt",
      size: size || "M",
      logoDecal: null,
      backLogoDecal: null,
      fullDecal: isFullTexture ? null : null,
      isLogoTexture: isLogoTexture || false,
      isFullTexture: isFullTexture || false,
      hasBackLogo: shouldSetBackLogoFlag,
      textData: textData ? JSON.stringify(textData) : null, // Legacy
      logoData: logo ? JSON.stringify(logo) : null,
      logoPosition: logoPosition
        ? JSON.stringify(logoPosition)
        : JSON.stringify(["front"]),
      backLogoPosition: backLogoPosition
        ? JSON.stringify(backLogoPosition)
        : null,
      thumbnail: null,
      // 🆕 TEXT FIELDS
      frontTextDecal: null,
      backTextDecal: null,
      frontTextData: frontText ? JSON.stringify(frontText) : null,
      backTextData: backText ? JSON.stringify(backText) : null,
      hasFrontText: !!hasFrontTextContent,
      hasBackText: !!hasBackTextContent,
    });

    const designId = Array.isArray(result)
      ? result[0]?.insertId
      : result.insertId;
    if (!designId) throw new Error("Failed to get design ID");

    console.log("✅ Design inserted:", designId);

    // Handle back logo
    let backLogoToSave = backLogoDecal;
    if (hasFrontLogoOnBack && !hasDedicatedBackLogo) {
      backLogoToSave = logoDecal;
    }

    // 🆕 Save all files including text textures
    const [
      logoPath,
      backLogoPath,
      fullPath,
      thumbPath,
      frontTextPath,
      backTextPath,
    ] = await Promise.all([
      saveAndCompressImage(logoDecal, "logo", req.user.userId, designId),
      backLogoToSave
        ? saveAndCompressImage(
            backLogoToSave,
            "backLogo",
            req.user.userId,
            designId
          )
        : null,
      isFullTexture
        ? saveAndCompressImage(fullDecal, "texture", req.user.userId, designId)
        : null,
      saveAndCompressImage(thumbnail, "thumb", req.user.userId, designId),
      // 🆕 Save front text texture
      frontTextDecal
        ? saveAndCompressImage(
            frontTextDecal,
            "text",
            req.user.userId,
            designId
          )
        : null,
      // 🆕 Save back text texture
      backTextDecal
        ? saveAndCompressImage(backTextDecal, "text", req.user.userId, designId)
        : null,
    ]);

    console.log("🔥 Saved files:", {
      logoPath,
      backLogoPath,
      fullPath,
      thumbPath,
      frontTextPath,
      backTextPath,
    });

    // Update with file paths
    await db
      .update(designs)
      .set({
        logoDecal: logoPath,
        backLogoDecal: backLogoPath,
        fullDecal: fullPath,
        thumbnail: thumbPath,
        frontTextDecal: frontTextPath,
        backTextDecal: backTextPath,
      })
      .where(eq(designs.id, designId));

    console.log("✅ Design saved with text support");

    res.status(201).json({ message: "Design saved successfully", designId });
  } catch (error) {
    console.error("❌ Save error:", error);
    res.status(500).json({ error: "Failed to save design" });
  }
});

// 🔥 GET ALL DESIGNS
router.get("/", authenticateToken, async (req, res) => {
  try {
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

    res.json({
      designs: userDesigns.map((d) => parseDesign(d, req)),
      total: Number(totalCount),
      limit: limitNum,
      offset: offsetNum,
    });
  } catch (error) {
    console.error("❌ Fetch error:", error);
    res.status(500).json({ error: "Failed to fetch designs" });
  }
});

// 🔥 GET SPECIFIC DESIGN
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const [design] = await db
      .select()
      .from(designs)
      .where(
        and(
          eq(designs.id, parseInt(req.params.id)),
          eq(designs.userId, req.user.userId)
        )
      );

    if (!design) return res.status(404).json({ error: "Design not found" });

    // 🔥 DEBUG: Check raw DB data
    console.log("📦 Raw DB data for design", req.params.id, ":", {
      id: design.id,
      name: design.name,
      logoDecal: design.logoDecal,
      backLogoDecal: design.backLogoDecal,
      logoPosition: design.logoPosition,
      hasBackLogo: design.hasBackLogo,
      frontTextDecal: design.frontTextDecal,
      backTextDecal: design.backTextDecal,
      hasFrontText: design.hasFrontText,
      hasBackText: design.hasBackText,
    });

    const parsed = parseDesign(design, req);

    // 🔥 DEBUG: Check parsed data
    console.log("📤 Parsed data being sent:", {
      id: parsed.id,
      logoDecal: parsed.logoDecal,
      backLogoDecal: parsed.backLogoDecal,
      logoPosition: parsed.logoPosition,
      frontTextDecal: parsed.frontTextDecal,
      backTextDecal: parsed.backTextDecal,
    });

    res.json(parsed);
  } catch (error) {
    console.error("❌ Fetch error:", error);
    res.status(500).json({ error: "Failed to fetch design" });
  }
});

// 🔥 DELETE DESIGN
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const [existing] = await db
      .select()
      .from(designs)
      .where(
        and(
          eq(designs.id, parseInt(req.params.id)),
          eq(designs.userId, req.user.userId)
        )
      );

    if (!existing) return res.status(404).json({ error: "Design not found" });

    // Delete all files including text textures
    [
      existing.logoDecal,
      existing.backLogoDecal,
      existing.fullDecal,
      existing.thumbnail,
      existing.frontTextDecal, // 🆕
      existing.backTextDecal, // 🆕
    ].forEach(deleteFile);

    await db.delete(designs).where(eq(designs.id, parseInt(req.params.id)));

    res.json({ message: "Design deleted successfully" });
  } catch (error) {
    console.error("❌ Delete error:", error);
    res.status(500).json({ error: "Failed to delete design" });
  }
});

export default router;

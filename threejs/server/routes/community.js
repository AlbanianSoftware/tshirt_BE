// routes/community.js
import express from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { db } from "../db/index.js";
import { communityPosts, designs, users } from "../db/schema.js";
import { eq, desc, like, or } from "drizzle-orm";

const router = express.Router();
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// ✅ Validation Schema
const publishSchema = z.object({
  designId: z.number().positive(),
  title: z.string().min(3).max(100).trim(),
  description: z.string().max(500).trim().optional(),
});

// Middleware to optionally check JWT (for getting user info, not required)
const optionalAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = { id: decoded.userId };
    }
  } catch (error) {
    // Token invalid or expired, continue without auth
  }
  next();
};

// Middleware to require authentication
const requireAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// 📖 GET all community posts with DATABASE SEARCH
router.get("/", async (req, res) => {
  try {
    const { search, limit = 50, offset = 0 } = req.query;

    let query = db
      .select({
        // Post info
        id: communityPosts.id,
        title: communityPosts.title,
        description: communityPosts.description,
        views: communityPosts.views,
        likes: communityPosts.likes,
        createdAt: communityPosts.createdAt,

        // Design info
        designId: designs.id,
        color: designs.color,
        shirtType: designs.shirtType,
        logoDecal: designs.logoDecal,
        fullDecal: designs.fullDecal,
        isLogoTexture: designs.isLogoTexture,
        isFullTexture: designs.isFullTexture,
        textData: designs.textData,
        thumbnail: designs.thumbnail,

        // User info (creator)
        userId: users.id,
        username: users.username,
      })
      .from(communityPosts)
      .leftJoin(designs, eq(communityPosts.designId, designs.id))
      .leftJoin(users, eq(communityPosts.userId, users.id));

    // 🔍 Add search filter if provided
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.where(
        or(
          like(communityPosts.title, searchTerm),
          like(communityPosts.description, searchTerm),
          like(users.username, searchTerm)
        )
      );
    }

    const posts = await query
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .orderBy(desc(communityPosts.createdAt));

    // Parse textData JSON
    const parsedPosts = posts.map((post) => ({
      ...post,
      textData: post.textData ? JSON.parse(post.textData) : null,
    }));

    res.json(parsedPosts);
  } catch (error) {
    console.error("Error fetching community posts:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// 📖 GET single post by ID (PUBLIC)
router.get("/:id", async (req, res) => {
  try {
    const postId = parseInt(req.params.id);

    const [post] = await db
      .select({
        id: communityPosts.id,
        title: communityPosts.title,
        description: communityPosts.description,
        views: communityPosts.views,
        likes: communityPosts.likes,
        createdAt: communityPosts.createdAt,

        designId: designs.id,
        color: designs.color,
        shirtType: designs.shirtType,
        logoDecal: designs.logoDecal,
        fullDecal: designs.fullDecal,
        isLogoTexture: designs.isLogoTexture,
        isFullTexture: designs.isFullTexture,
        textData: designs.textData,
        thumbnail: designs.thumbnail,

        userId: users.id,
        username: users.username,
      })
      .from(communityPosts)
      .leftJoin(designs, eq(communityPosts.designId, designs.id))
      .leftJoin(users, eq(communityPosts.userId, users.id))
      .where(eq(communityPosts.id, postId));

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Increment view count
    await db
      .update(communityPosts)
      .set({ views: post.views + 1 })
      .where(eq(communityPosts.id, postId));

    // Parse textData
    const parsedPost = {
      ...post,
      textData: post.textData ? JSON.parse(post.textData) : null,
    };

    res.json(parsedPost);
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

// 🎨 GET design data for community post (PUBLIC - for viewing in customizer)
router.get("/:id/design", async (req, res) => {
  try {
    const postId = parseInt(req.params.id);

    const [post] = await db
      .select({
        color: designs.color,
        shirtType: designs.shirtType,
        logoDecal: designs.logoDecal,
        fullDecal: designs.fullDecal,
        isLogoTexture: designs.isLogoTexture,
        isFullTexture: designs.isFullTexture,
        textData: designs.textData,
      })
      .from(communityPosts)
      .leftJoin(designs, eq(communityPosts.designId, designs.id))
      .where(eq(communityPosts.id, postId));

    if (!post) {
      return res.status(404).json({ error: "Design not found" });
    }

    // Parse textData
    const design = {
      ...post,
      textData: post.textData ? JSON.parse(post.textData) : null,
    };

    res.json(design);
  } catch (error) {
    console.error("Error fetching design:", error);
    res.status(500).json({ error: "Failed to fetch design" });
  }
});

// ✍️ POST - Publish a design with VALIDATION & SANITIZATION
router.post("/", requireAuth, async (req, res) => {
  try {
    // ✅ Validate input
    const validated = publishSchema.parse(req.body);

    // ✅ Sanitize (remove HTML tags, scripts)
    const cleanTitle = validated.title.replace(/<[^>]*>/g, "");
    const cleanDescription =
      validated.description?.replace(/<[^>]*>/g, "") || null;

    // Verify the design belongs to the user
    const [design] = await db
      .select()
      .from(designs)
      .where(eq(designs.id, validated.designId));

    if (!design) {
      return res.status(404).json({ error: "Design not found" });
    }

    if (design.userId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "You can only publish your own designs" });
    }

    // Check if already published
    const [existing] = await db
      .select()
      .from(communityPosts)
      .where(eq(communityPosts.designId, validated.designId));

    if (existing) {
      return res
        .status(400)
        .json({ error: "This design is already published" });
    }

    // Create community post with cleaned data
    const newPost = await db.insert(communityPosts).values({
      userId: req.user.id,
      designId: validated.designId,
      title: cleanTitle,
      description: cleanDescription,
    });

    res.status(201).json({
      message: "Design published to community!",
      postId: newPost.insertId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid input",
        details: error.errors,
      });
    }
    console.error("Error publishing design:", error);
    res.status(500).json({ error: "Failed to publish design" });
  }
});

// 🗑️ DELETE - Remove post from community (ONLY OWNER)
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);

    // Verify ownership
    const [post] = await db
      .select()
      .from(communityPosts)
      .where(eq(communityPosts.id, postId));

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.userId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "You can only delete your own posts" });
    }

    await db.delete(communityPosts).where(eq(communityPosts.id, postId));

    res.json({ message: "Post removed from community" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ error: "Failed to delete post" });
  }
});

export default router;

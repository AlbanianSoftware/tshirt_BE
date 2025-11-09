// routes/community.js - COMPLETE FIXED VERSION
import express from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { db } from "../db/index.js";
import { communityPosts, designs, users } from "../db/schema.js";
import { eq, desc, like, or, and, sql } from "drizzle-orm";

const router = express.Router();
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

const publishSchema = z.object({
  designId: z.number().positive(),
  title: z.string().min(3).max(100).trim(),
  description: z.string().max(500).trim().optional(),
});

const requireAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: Number(decoded.userId) };
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// 📖 GET all community posts with SERVER-SIDE PAGINATION & FILTERING
router.get("/", async (req, res) => {
  try {
    const {
      search,
      limit = 10,
      offset = 0,
      userId, // Filter by userId for "My Designs"
    } = req.query;

    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);

    console.log("📥 GET /api/community", {
      search,
      limit: limitNum,
      offset: offsetNum,
      userId,
    });

    // Build base query
    let query = db
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
        logoData: designs.logoData,
        thumbnail: designs.thumbnail,

        userId: users.id,
        username: users.username,
      })
      .from(communityPosts)
      .leftJoin(designs, eq(communityPosts.designId, designs.id))
      .leftJoin(users, eq(communityPosts.userId, users.id));

    // Build WHERE conditions
    const conditions = [];

    // 🔍 Search filter
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          like(communityPosts.title, searchTerm),
          like(communityPosts.description, searchTerm),
          like(users.username, searchTerm)
        )
      );
    }

    // 👤 User filter for "My Designs"
    if (userId) {
      console.log("🔍 Filtering by userId:", userId);
      conditions.push(eq(communityPosts.userId, Number(userId)));
    }

    // Apply WHERE conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Get total count for pagination
    let countQuery = db
      .select({ count: sql`count(*)` })
      .from(communityPosts)
      .leftJoin(designs, eq(communityPosts.designId, designs.id))
      .leftJoin(users, eq(communityPosts.userId, users.id));

    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }

    const [{ count: totalCount }] = await countQuery;

    // 🔥 FIX: Get authenticated user's designs count
    let myDesignsCount = 0;
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const authenticatedUserId = Number(decoded.userId);

        const [{ count }] = await db
          .select({ count: sql`count(*)` })
          .from(communityPosts)
          .where(eq(communityPosts.userId, authenticatedUserId));
        myDesignsCount = Number(count);

        console.log(
          "👤 User ID:",
          authenticatedUserId,
          "has",
          myDesignsCount,
          "published designs"
        );
      } catch (error) {
        console.log("⚠️ Token invalid or not provided");
      }
    }

    // Fetch posts with pagination
    const posts = await query
      .limit(limitNum)
      .offset(offsetNum)
      .orderBy(desc(communityPosts.createdAt));

    // Parse JSON fields
    const parsedPosts = posts.map((post) => ({
      ...post,
      userId: Number(post.userId),
      textData: post.textData ? JSON.parse(post.textData) : null,
      logo: post.logoData ? JSON.parse(post.logoData) : null,
    }));

    console.log("✅ Returning:", {
      postsCount: parsedPosts.length,
      total: Number(totalCount),
      myDesignsCount,
    });

    res.json({
      posts: parsedPosts,
      total: Number(totalCount),
      myDesignsCount,
      limit: limitNum,
      offset: offsetNum,
    });
  } catch (error) {
    console.error("❌ Error fetching community posts:", error);
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
        logoData: designs.logoData,
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

    // Parse JSON fields
    const parsedPost = {
      ...post,
      userId: Number(post.userId),
      textData: post.textData ? JSON.parse(post.textData) : null,
      logo: post.logoData ? JSON.parse(post.logoData) : null,
    };

    res.json(parsedPost);
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

// 🎨 GET design data for community post (PUBLIC)
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
        logoData: designs.logoData,
      })
      .from(communityPosts)
      .leftJoin(designs, eq(communityPosts.designId, designs.id))
      .where(eq(communityPosts.id, postId));

    if (!post) {
      return res.status(404).json({ error: "Design not found" });
    }

    const design = {
      ...post,
      textData: post.textData ? JSON.parse(post.textData) : null,
      logo: post.logoData ? JSON.parse(post.logoData) : null,
    };

    res.json(design);
  } catch (error) {
    console.error("Error fetching design:", error);
    res.status(500).json({ error: "Failed to fetch design" });
  }
});

// ✍️ POST - Publish a design
router.post("/", requireAuth, async (req, res) => {
  try {
    const validated = publishSchema.parse(req.body);
    const cleanTitle = validated.title.replace(/<[^>]*>/g, "");
    const cleanDescription =
      validated.description?.replace(/<[^>]*>/g, "") || null;

    const [design] = await db
      .select()
      .from(designs)
      .where(eq(designs.id, validated.designId));

    if (!design) {
      return res.status(404).json({ error: "Design not found" });
    }

    if (Number(design.userId) !== Number(req.user.id)) {
      return res
        .status(403)
        .json({ error: "You can only publish your own designs" });
    }

    const [existing] = await db
      .select()
      .from(communityPosts)
      .where(eq(communityPosts.designId, validated.designId));

    if (existing) {
      return res
        .status(400)
        .json({ error: "This design is already published" });
    }

    const [newPost] = await db.insert(communityPosts).values({
      userId: Number(req.user.id),
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

// 🗑️ DELETE - Remove post from community
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);

    const [post] = await db
      .select()
      .from(communityPosts)
      .where(eq(communityPosts.id, postId));

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (Number(post.userId) !== Number(req.user.id)) {
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

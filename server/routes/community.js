// routes/community.js - COMPLETE FIX with /design endpoint
import express from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { db } from "../db/index.js";
import {
  communityPosts,
  designs,
  users,
  postLikes,
  postComments,
} from "../db/schema.js";
import { eq, desc, like, or, and, sql, isNull } from "drizzle-orm";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "";

const publishSchema = z.object({
  designId: z.number().positive(),
  title: z.string().min(3).max(100).trim(),
  description: z.string().max(500).trim().optional(),
});

const commentSchema = z.object({
  content: z.string().min(1).max(1000).trim(),
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

// GET all community posts with pagination & filtering
router.get("/", async (req, res) => {
  try {
    const { search, limit = 10, offset = 0, userId } = req.query;
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);

    let authenticatedUserId = null;
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        authenticatedUserId = Number(decoded.userId);
      } catch (e) {}
    }

    let query = db
      .select({
        id: communityPosts.id,
        title: communityPosts.title,
        description: communityPosts.description,
        views: communityPosts.views,
        likesCount: communityPosts.likesCount,
        commentsCount: communityPosts.commentsCount,
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
        logoPosition: designs.logoPosition,
        thumbnail: designs.thumbnail,

        userId: users.id,
        username: users.username,
      })
      .from(communityPosts)
      .leftJoin(designs, eq(communityPosts.designId, designs.id))
      .leftJoin(users, eq(communityPosts.userId, users.id));

    const conditions = [isNull(communityPosts.deletedAt)];

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

    if (userId) {
      conditions.push(eq(communityPosts.userId, Number(userId)));
    }

    query = query.where(and(...conditions));

    let countQuery = db
      .select({ count: sql`count(*)` })
      .from(communityPosts)
      .leftJoin(designs, eq(communityPosts.designId, designs.id))
      .leftJoin(users, eq(communityPosts.userId, users.id))
      .where(and(...conditions));

    const [{ count: totalCount }] = await countQuery;

    let myDesignsCount = 0;
    if (authenticatedUserId) {
      const [{ count }] = await db
        .select({ count: sql`count(*)` })
        .from(communityPosts)
        .where(
          and(
            eq(communityPosts.userId, authenticatedUserId),
            isNull(communityPosts.deletedAt)
          )
        );
      myDesignsCount = Number(count);
    }

    const posts = await query
      .limit(limitNum)
      .offset(offsetNum)
      .orderBy(desc(communityPosts.createdAt));

    let userLikes = new Set();
    if (authenticatedUserId) {
      const likes = await db
        .select({ postId: postLikes.postId })
        .from(postLikes)
        .where(eq(postLikes.userId, authenticatedUserId));
      userLikes = new Set(likes.map((l) => l.postId));
    }

    const parsedPosts = posts.map((post) => ({
      ...post,
      userId: Number(post.userId),
      textData: post.textData ? JSON.parse(post.textData) : null,
      logo: post.logoData ? JSON.parse(post.logoData) : null,
      logoPosition: post.logoPosition
        ? JSON.parse(post.logoPosition)
        : ["front"],
      isLiked: userLikes.has(post.id),
    }));

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

// POST - Track view (separate endpoint)
router.post("/:id/view", async (req, res) => {
  try {
    const postId = parseInt(req.params.id);

    const [post] = await db
      .select()
      .from(communityPosts)
      .where(
        and(eq(communityPosts.id, postId), isNull(communityPosts.deletedAt))
      );

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    await db
      .update(communityPosts)
      .set({ views: post.views + 1 })
      .where(eq(communityPosts.id, postId));

    res.json({ views: post.views + 1 });
  } catch (error) {
    res.status(500).json({ error: "Failed to track view" });
  }
});

// GET single post by ID (NO view increment - that's in POST /:id/view)
router.get("/:id", async (req, res) => {
  try {
    const postId = parseInt(req.params.id);

    const [post] = await db
      .select({
        id: communityPosts.id,
        title: communityPosts.title,
        description: communityPosts.description,
        views: communityPosts.views,
        likesCount: communityPosts.likesCount,
        commentsCount: communityPosts.commentsCount,
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
        logoPosition: designs.logoPosition,
        thumbnail: designs.thumbnail,

        userId: users.id,
        username: users.username,
      })
      .from(communityPosts)
      .leftJoin(designs, eq(communityPosts.designId, designs.id))
      .leftJoin(users, eq(communityPosts.userId, users.id))
      .where(
        and(eq(communityPosts.id, postId), isNull(communityPosts.deletedAt))
      );

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const parsedPost = {
      ...post,
      userId: Number(post.userId),
      textData: post.textData ? JSON.parse(post.textData) : null,
      logo: post.logoData ? JSON.parse(post.logoData) : null,
      logoPosition: post.logoPosition
        ? JSON.parse(post.logoPosition)
        : ["front"],
    };

    res.json(parsedPost);
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

// 🆕 GET design data for a post (MISSING ENDPOINT - NOW ADDED)
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
        logoPosition: designs.logoPosition,
      })
      .from(communityPosts)
      .leftJoin(designs, eq(communityPosts.designId, designs.id))
      .where(
        and(eq(communityPosts.id, postId), isNull(communityPosts.deletedAt))
      );

    if (!post) {
      return res.status(404).json({ error: "Design not found" });
    }

    const design = {
      ...post,
      textData: post.textData ? JSON.parse(post.textData) : null,
      logo: post.logoData ? JSON.parse(post.logoData) : null,
      logoPosition: post.logoPosition
        ? JSON.parse(post.logoPosition)
        : ["front"],
    };

    res.json(design);
  } catch (error) {
    console.error("Error fetching design:", error);
    res.status(500).json({ error: "Failed to fetch design" });
  }
});

// POST - Publish a design
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
      .where(
        and(
          eq(communityPosts.designId, validated.designId),
          isNull(communityPosts.deletedAt)
        )
      );

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
      return res
        .status(400)
        .json({ error: "Invalid input", details: error.errors });
    }
    console.error("Error publishing design:", error);
    res.status(500).json({ error: "Failed to publish design" });
  }
});

// DELETE - Soft delete post
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);

    const [post] = await db
      .select()
      .from(communityPosts)
      .where(eq(communityPosts.id, postId));

    if (!post || post.deletedAt) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (Number(post.userId) !== Number(req.user.id)) {
      return res
        .status(403)
        .json({ error: "You can only delete your own posts" });
    }

    await db
      .update(communityPosts)
      .set({ deletedAt: new Date() })
      .where(eq(communityPosts.id, postId));

    res.json({ message: "Post removed from community" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ error: "Failed to delete post" });
  }
});

// POST - Toggle like
router.post("/:id/like", requireAuth, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = req.user.id;

    const [post] = await db
      .select()
      .from(communityPosts)
      .where(
        and(eq(communityPosts.id, postId), isNull(communityPosts.deletedAt))
      );

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const [existingLike] = await db
      .select()
      .from(postLikes)
      .where(and(eq(postLikes.userId, userId), eq(postLikes.postId, postId)));

    if (existingLike) {
      await db
        .delete(postLikes)
        .where(and(eq(postLikes.userId, userId), eq(postLikes.postId, postId)));

      await db
        .update(communityPosts)
        .set({ likesCount: Math.max(0, post.likesCount - 1) })
        .where(eq(communityPosts.id, postId));

      res.json({ liked: false, likesCount: Math.max(0, post.likesCount - 1) });
    } else {
      await db.insert(postLikes).values({ userId, postId });

      await db
        .update(communityPosts)
        .set({ likesCount: post.likesCount + 1 })
        .where(eq(communityPosts.id, postId));

      res.json({ liked: true, likesCount: post.likesCount + 1 });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ error: "Failed to toggle like" });
  }
});

// GET - Get comments for a post
router.get("/:id/comments", async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { limit = 20, offset = 0 } = req.query;

    const comments = await db
      .select({
        id: postComments.id,
        content: postComments.content,
        createdAt: postComments.createdAt,
        updatedAt: postComments.updatedAt,
        userId: users.id,
        username: users.username,
      })
      .from(postComments)
      .leftJoin(users, eq(postComments.userId, users.id))
      .where(
        and(eq(postComments.postId, postId), isNull(postComments.deletedAt))
      )
      .orderBy(desc(postComments.createdAt))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    res.json({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// POST - Add comment
router.post("/:id/comments", requireAuth, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const validated = commentSchema.parse(req.body);

    const [post] = await db
      .select()
      .from(communityPosts)
      .where(
        and(eq(communityPosts.id, postId), isNull(communityPosts.deletedAt))
      );

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const [newComment] = await db.insert(postComments).values({
      userId: req.user.id,
      postId,
      content: validated.content,
    });

    await db
      .update(communityPosts)
      .set({ commentsCount: post.commentsCount + 1 })
      .where(eq(communityPosts.id, postId));

    const [comment] = await db
      .select({
        id: postComments.id,
        content: postComments.content,
        createdAt: postComments.createdAt,
        userId: users.id,
        username: users.username,
      })
      .from(postComments)
      .leftJoin(users, eq(postComments.userId, users.id))
      .where(eq(postComments.id, newComment.insertId));

    res.status(201).json({ comment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid input", details: error.errors });
    }
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// DELETE - Soft delete comment
router.delete("/:postId/comments/:commentId", requireAuth, async (req, res) => {
  try {
    const commentId = parseInt(req.params.commentId);
    const postId = parseInt(req.params.postId);

    const [comment] = await db
      .select()
      .from(postComments)
      .where(eq(postComments.id, commentId));

    if (!comment || comment.deletedAt) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (Number(comment.userId) !== Number(req.user.id)) {
      return res
        .status(403)
        .json({ error: "You can only delete your own comments" });
    }

    await db
      .update(postComments)
      .set({ deletedAt: new Date() })
      .where(eq(postComments.id, commentId));

    const [post] = await db
      .select()
      .from(communityPosts)
      .where(eq(communityPosts.id, postId));

    if (post) {
      await db
        .update(communityPosts)
        .set({ commentsCount: Math.max(0, post.commentsCount - 1) })
        .where(eq(communityPosts.id, postId));
    }

    res.json({ message: "Comment deleted" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

export default router;

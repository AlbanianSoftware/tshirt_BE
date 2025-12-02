// server/routes/admin.js
import express from "express";
import { db } from "../db/index.js";
import {
  users,
  designs,
  communityPosts,
  postLikes,
  postComments,
} from "../db/schema.js";
import { eq, isNull, sql } from "drizzle-orm";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    console.log("🔍 Checking admin status for user:", req.user.userId);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user.userId));

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

// Get all community posts with likes and comments
router.get("/posts", async (req, res) => {
  try {
    const allPosts = await db
      .select({
        id: communityPosts.id,
        title: communityPosts.title,
        description: communityPosts.description,
        views: communityPosts.views,
        likesCount: communityPosts.likesCount,
        commentsCount: communityPosts.commentsCount,
        createdAt: communityPosts.createdAt,
        username: users.username,
        userId: users.id,
        thumbnail: designs.thumbnail,
        designId: communityPosts.designId,
      })
      .from(communityPosts)
      .leftJoin(users, eq(communityPosts.userId, users.id))
      .leftJoin(designs, eq(communityPosts.designId, designs.id))
      .where(isNull(communityPosts.deletedAt))
      .orderBy(sql`${communityPosts.createdAt} DESC`);

    res.json(allPosts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete post (soft delete)
router.delete("/posts/:id", async (req, res) => {
  try {
    const postId = parseInt(req.params.id);

    await db
      .update(communityPosts)
      .set({ deletedAt: new Date() })
      .where(eq(communityPosts.id, postId));

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

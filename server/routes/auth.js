// routes/auth.js - SECURE WITH HTTPONLY COOKIES
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

const router = express.Router();

// 🔥 USE COOKIE PARSER MIDDLEWARE
router.use(cookieParser());

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d";

// 🔥 HELPER: Set secure cookie
const setTokenCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true, // Cannot be accessed by JavaScript
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "strict", // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// 🔥 HELPER: Clear cookie
const clearTokenCookie = (res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
};

// Register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await db.insert(users).values({
      username,
      email,
      password: hashedPassword,
      isAdmin: false,
    });

    const userId = Array.isArray(result)
      ? result[0]?.insertId
      : result.insertId;

    // Generate JWT
    const token = jwt.sign({ userId }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    // 🔥 SET HTTPONLY COOKIE
    setTokenCookie(res, token);

    // Send user data (NO TOKEN IN RESPONSE!)
    res.status(201).json({
      message: "Registration successful",
      user: {
        id: userId,
        username,
        email,
        isAdmin: false,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    // 🔥 SET HTTPONLY COOKIE
    setTokenCookie(res, token);

    console.log("✅ User logged in:", user.email);

    // Send user data (NO TOKEN IN RESPONSE!)
    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// 🔥 Logout endpoint
router.post("/logout", (req, res) => {
  clearTokenCookie(res);
  res.json({ message: "Logged out successfully" });
});

// 🔥 Check auth status (verify cookie)
router.get("/me", async (req, res) => {
  try {
    // Get token from cookie (parsed by cookie-parser)
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        isAdmin: users.isAdmin,
      })
      .from(users)
      .where(eq(users.id, decoded.userId));

    if (!user) {
      clearTokenCookie(res);
      return res.status(401).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Auth check error:", error);
    clearTokenCookie(res);
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;

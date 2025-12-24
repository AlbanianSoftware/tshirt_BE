// routes/auth.js - PRODUCTION-GRADE WITH VALIDATION & SECURITY
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq, or } from "drizzle-orm";

const router = express.Router();
router.use(cookieParser());

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d";

// 🔥 RATE LIMITING - Prevent brute force attacks
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 attempts per 5 minutes
  message: { error: "Too many attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
});

const registerLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 15, // 15 registrations per 5 minutes
  message: { error: "Too many registration attempts, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// 🔥 EMAIL VALIDATION
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 🔥 PASSWORD VALIDATION
const validatePassword = (password) => {
  const errors = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return errors;
};

// 🔥 USERNAME VALIDATION
const validateUsername = (username) => {
  const errors = [];

  if (username.length < 3) {
    errors.push("Username must be at least 3 characters");
  }
  if (username.length > 20) {
    errors.push("Username must be less than 20 characters");
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push("Username can only contain letters, numbers, and underscores");
  }

  return errors;
};

// 🔥 HELPER: Set secure cookie
const setTokenCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
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

// 🔥 REGISTER with validation & specific error messages
router.post("/register", registerLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Input validation
    if (!username || !email || !password) {
      return res.status(400).json({
        error: "All fields are required",
        field: "general",
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: "Invalid email format",
        field: "email",
      });
    }

    // Validate username
    const usernameErrors = validateUsername(username);
    if (usernameErrors.length > 0) {
      return res.status(400).json({
        error: usernameErrors[0],
        field: "username",
      });
    }

    // Validate password
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        error: passwordErrors.join(". "),
        field: "password",
      });
    }

    // 🔥 Check if username OR email already exists (single query)
    const [existingUser] = await db
      .select()
      .from(users)
      .where(or(eq(users.email, email), eq(users.username, username)))
      .limit(1);

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({
          error: "This email is already registered",
          field: "email",
        });
      }
      if (existingUser.username === username) {
        return res.status(400).json({
          error: "This username is already taken",
          field: "username",
        });
      }
    }

    // Hash password with higher cost for better security
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const result = await db.insert(users).values({
      username: username.toLowerCase(), // Store lowercase for consistency
      email: email.toLowerCase(),
      password: hashedPassword,
      isAdmin: false,
    });

    const userId = Array.isArray(result)
      ? result[0]?.insertId
      : result.insertId;

    // Generate JWT
    const token = jwt.sign({ userId, email: email.toLowerCase() }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    // Set HTTPOnly cookie
    setTokenCookie(res, token);

    console.log("✅ New user registered:", email);

    // Send user data
    res.status(201).json({
      message: "Registration successful",
      user: {
        id: userId,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        isAdmin: false,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      error: "Registration failed. Please try again.",
      field: "general",
    });
  }
});

// 🔥 LOGIN with rate limiting
router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
        field: "general",
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: "Invalid email format",
        field: "email",
      });
    }

    // Find user (case-insensitive email)
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
        field: "general",
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        error: "Invalid email or password",
        field: "general",
      });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    // Set HTTPOnly cookie
    setTokenCookie(res, token);

    console.log("✅ User logged in:", user.email);

    // Send user data
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
    res.status(500).json({
      error: "Login failed. Please try again.",
      field: "general",
    });
  }
});

// 🔥 LOGOUT
router.post("/logout", (req, res) => {
  clearTokenCookie(res);
  res.json({ message: "Logged out successfully" });
});

// 🔥 CHECK AUTH STATUS
router.get("/me", async (req, res) => {
  try {
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
      .where(eq(users.id, decoded.userId))
      .limit(1);

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

// 🔥 CHECK EMAIL AVAILABILITY (for real-time validation)
router.post("/check-email", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.json({ available: false, message: "Invalid email format" });
    }

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    res.json({
      available: !existing,
      message: existing ? "Email already registered" : "Email available",
    });
  } catch (error) {
    console.error("Email check error:", error);
    res.status(500).json({ available: false, message: "Check failed" });
  }
});

// 🔥 CHECK USERNAME AVAILABILITY (for real-time validation)
router.post("/check-username", async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || username.length < 3) {
      return res.json({ available: false, message: "Username too short" });
    }

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username.toLowerCase()))
      .limit(1);

    res.json({
      available: !existing,
      message: existing ? "Username already taken" : "Username available",
    });
  } catch (error) {
    console.error("Username check error:", error);
    res.status(500).json({ available: false, message: "Check failed" });
  }
});

export default router;

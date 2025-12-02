import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

const router = express.Router();
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [newUser] = await db.insert(users).values({
      username,
      email,
      password: hashedPassword,
    });

    // Generate token
    const token = jwt.sign(
      {
        userId: newUser.insertId,
        email,
        isAdmin: false, // New users are not admins by default
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser.insertId,
        username,
        email,
        isAdmin: false,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, isAdmin: user.isAdmin }, // 👈 ADD isAdmin to token
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin, // 👈 RETURN isAdmin
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Verify token
router.get("/verify", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId));

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin, // 👈 RETURN isAdmin
      },
    });
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
});

export default router;

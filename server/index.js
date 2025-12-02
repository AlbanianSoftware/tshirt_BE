import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import communityRoutes from "./routes/community.js";
import adminRoutes from "./routes/admin.js";
import orderRoutes from "./routes/orders.js";

const app = express();
const PORT = process.env.PORT || 3001;

// 🔥 STEP 1: CORS (first) - Dynamic origin for production
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",")
  : ["http://localhost:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // ✅ Added PATCH
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 🔥 STEP 2: Body parsers (BEFORE routes!)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// 🔥 STEP 3: Logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url}`);
  next();
});

// 🔥 STEP 4: Rate Limiting for Publishing
const publishLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20000, // change the limit latter, used to prevent spam...posts per 15 min
  message: { error: "Too many posts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// 🔥 STEP 5: Import routes with error handling
let authRoutes, designsRoutes, cartRoutes;

try {
  authRoutes = (await import("./routes/auth.js")).default;
  console.log("✅ Auth routes loaded");
} catch (e) {
  console.error("❌ Failed to load auth routes:", e.message);
}

try {
  designsRoutes = (await import("./routes/designs.js")).default;
  console.log("✅ Design routes loaded");
} catch (e) {
  console.error("❌ Failed to load design routes:", e.message);
}

try {
  cartRoutes = (await import("./routes/cart.js")).default;
  console.log("✅ Cart routes loaded");
} catch (e) {
  console.error("❌ Failed to load cart routes:", e.message);
}

console.log("✅ Community routes loaded");

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// 🔥 STEP 6: Mount routes (AFTER body parsers!)
if (authRoutes) app.use("/api/auth", authRoutes);
if (designsRoutes) app.use("/api/designs", designsRoutes);
if (cartRoutes) {
  app.use("/api/cart", cartRoutes);
  console.log("✅ Cart routes mounted at /api/cart");
}

// Apply rate limiting only to community routes
app.use("/api/community", publishLimiter, communityRoutes);
console.log(
  "✅ Community routes mounted at /api/community (with rate limiting)"
);

app.use("/api/admin", adminRoutes);

app.use("/api/orders", orderRoutes);
// 404 handler - STAYS AT THE END
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📍 Available at: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🔗 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:5173"}`
  );
  console.log("\n📋 Registered routes:");
  console.log("  - GET  /health");
  console.log("  - /api/auth");
  console.log("  - /api/designs");
  console.log("  - /api/cart");
  console.log("  - /api/community (⏱️ rate limited)");
});

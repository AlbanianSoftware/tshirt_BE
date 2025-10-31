import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// 🎯 MOVE LOGGING HERE - BEFORE ROUTES
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url}`);
  next();
});

// Import routes with error handling
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

// Mount routes
if (authRoutes) app.use("/api/auth", authRoutes);
if (designsRoutes) app.use("/api/designs", designsRoutes);
if (cartRoutes) {
  app.use("/api/cart", cartRoutes);
  console.log("✅ Cart routes mounted at /api/cart");
}

// 404 handler - STAYS AT THE END
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📍 Available at: http://localhost:${PORT}`);
  console.log("\n📋 Registered routes:");
  console.log("  - /api/auth");
  console.log("  - /api/designs");
  console.log("  - /api/cart");
});

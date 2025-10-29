import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import designsRoutes from "./routes/designs.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Fix CORS to allow credentials from your frontend
app.use(
  cors({
    origin: "http://localhost:5173", // Your Vite dev server
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/designs", designsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

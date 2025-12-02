import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

export const authenticateToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ error: "No token provided. Please log in." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    // FIX: Set req.user.userId (not req.user.id)
    req.user = { userId: decoded.userId };
    console.log("✅ Authenticated user:", req.user.userId);
    next();
  } catch (error) {
    console.error("❌ Auth error:", error.message);
    return res
      .status(401)
      .json({ error: "Invalid token. Please log in again." });
  }
};

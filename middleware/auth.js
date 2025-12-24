// middleware/auth.js - READS TOKEN FROM COOKIES
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

export const authenticateToken = (req, res, next) => {
  try {
    // 🔥 Read token from cookie (httpOnly secure)
    const token = req.cookies.token;

    if (!token) {
      console.log("❌ No token in cookies");
      return res.status(401).json({
        error: "No token provided. Please log in.",
        message: "Authentication required",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user info to request (support multiple formats for compatibility)
    req.user = {
      userId: decoded.userId,
      id: decoded.userId, // Some routes use .id
      sub: decoded.userId, // JWT standard
    };

    console.log("✅ Authenticated user:", req.user.userId);
    next();
  } catch (error) {
    console.error("❌ Auth token error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expired. Please log in again.",
        message: "Token expired, please login again",
      });
    }

    return res.status(403).json({
      error: "Invalid token. Please log in again.",
      message: "Invalid token",
    });
  }
};

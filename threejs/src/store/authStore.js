import { proxy } from "valtio";

// Check if token exists in localStorage
const storedToken = localStorage.getItem("token");
const storedUser = localStorage.getItem("user"); // if you store user info

const authState = proxy({
  user: storedUser ? JSON.parse(storedUser) : null,
  isAuthenticated: !!storedToken, // 🔥 FIX: Set to true if token exists
  token: storedToken || null,
  showLoginModal: false,
  showRegisterModal: false,
});

export default authState;

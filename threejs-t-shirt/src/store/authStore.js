import { proxy } from "valtio";

const authState = proxy({
  user: null,
  isAuthenticated: false,
  token: localStorage.getItem("token") || null,
  showLoginModal: false,
  showRegisterModal: false,
});

export default authState;

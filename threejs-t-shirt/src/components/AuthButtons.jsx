import { useSnapshot } from "valtio";
import authState from "../store/authStore";

const AuthButtons = () => {
  const snap = useSnapshot(authState);

  const handleLogout = () => {
    authState.isAuthenticated = false;
    authState.user = null;
    authState.token = null;
    localStorage.removeItem("token");
  };

  if (snap.isAuthenticated) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-white text-sm font-medium">
          Welcome, {snap.user?.username}!
        </span>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={() => (authState.showLoginModal = true)}
        className="px-4 py-2 bg-transparent border border-white text-white rounded-md hover:bg-white hover:text-black transition-all text-sm font-medium"
      >
        Login
      </button>
      <button
        onClick={() => (authState.showRegisterModal = true)}
        className="px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
      >
        Register
      </button>
    </div>
  );
};

export default AuthButtons;

import { useState } from "react";
import { useSnapshot } from "valtio";
import authState from "../store/authStore";
import { authService } from "../services/authService";

const RegisterModal = () => {
  const snap = useSnapshot(authState);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const data = await authService.register(username, email, password);
      localStorage.setItem("token", data.token);
      authState.token = data.token;
      authState.user = data.user;
      authState.isAuthenticated = true;
      authState.showRegisterModal = false;
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!snap.showRegisterModal) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-md">
        {/* Glass morphism card */}
        <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <button
              onClick={() => (authState.showRegisterModal = false)}
              className="absolute -top-2 -right-2 text-gray-400 hover:text-white transition-all text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 backdrop-blur-sm"
            >
              ×
            </button>

            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2 text-white tracking-tight">
                Create Account
              </h2>
              <p className="text-gray-400 text-sm">Join us today</p>
            </div>

            {error && (
              <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 text-red-300 px-4 py-3 rounded-xl mb-6">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 text-white placeholder-gray-500 transition-all hover:bg-white/10"
                  placeholder="johndoe"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 text-white placeholder-gray-500 transition-all hover:bg-white/10"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 text-white placeholder-gray-500 transition-all hover:bg-white/10"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmit(e);
                  }}
                  className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 text-white placeholder-gray-500 transition-all hover:bg-white/10"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full mt-6 bg-white/10 backdrop-blur-sm border border-white/20 text-white py-3.5 rounded-xl hover:bg-white/20 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-sm text-gray-400 text-center">
                Already have an account?{" "}
                <button
                  onClick={() => {
                    authState.showRegisterModal = false;
                    authState.showLoginModal = true;
                  }}
                  className="text-gray-300 hover:text-white font-semibold transition-colors hover:underline"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Decorative blur elements */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-gray-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gray-400/20 rounded-full blur-3xl pointer-events-none"></div>
      </div>
    </div>
  );
};

export default RegisterModal;

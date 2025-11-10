// pages/MyDesigns.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSnapshot } from "valtio";
import authState from "../store/authStore";

const MyDesigns = () => {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();
  const authSnap = useSnapshot(authState);

  const shirtTypeLabels = {
    tshirt: "T-Shirt",
    long_sleeve: "Long Sleeve",
    female_tshirt: "Women's Fit",
  };

  useEffect(() => {
    if (authSnap.isAuthenticated && authSnap.token) {
      fetchDesigns();
    } else {
      setError("Please log in to view your designs");
      setLoading(false);
    }
  }, [authSnap.isAuthenticated, authSnap.token]);

  const fetchDesigns = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/designs", {
        headers: { Authorization: `Bearer ${authSnap.token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch designs");
      }

      const data = await response.json();
      setDesigns(data);
    } catch (err) {
      setError(`Failed to load designs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDesign = (designId) => {
    navigate(`/customizer?design=${designId}`);
  };

  const handleDelete = async (designId) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/designs/${designId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${authSnap.token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to delete design");

      setDesigns(designs.filter((d) => d.id !== designId));
      setDeleteId(null);
    } catch (err) {
      setError("Failed to delete design");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!authSnap.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center p-6">
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-8 border border-white/10 shadow-2xl text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
          <p className="text-gray-400 mb-6">
            Please log in to view your saved designs
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-gray-400 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-400 text-lg">Loading designs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/customizer")}
              className="p-2.5 backdrop-blur-xl bg-white/10 hover:bg-white/15 text-white rounded-xl transition-all duration-300 border border-white/10 shadow-lg hover:shadow-xl group"
              title="Back to Customizer"
            >
              <svg
                className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              My Designs
            </h1>
          </div>
          <button
            onClick={() => navigate("/customizer")}
            className="px-5 py-2.5 backdrop-blur-xl bg-white/10 hover:bg-white/15 text-white rounded-xl transition-all duration-300 flex items-center gap-2 border border-white/10 shadow-lg hover:shadow-xl group"
          >
            <svg
              className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Design
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 backdrop-blur-xl bg-red-500/10 border border-red-500/30 rounded-xl text-red-300">
            {error}
          </div>
        )}

        {/* Designs Grid */}
        {designs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center border border-white/5">
              <svg
                className="w-12 h-12 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
            </div>
            <h2 className="text-2xl text-gray-300 mb-2 font-semibold">
              No designs yet
            </h2>
            <p className="text-gray-500 mb-8">
              Create your first t-shirt design!
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-8 py-3 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Start Designing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {designs.map((design) => (
              <div
                key={design.id}
                className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 overflow-hidden hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-lg hover:shadow-2xl group"
              >
                {/* Thumbnail */}
                <div
                  className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 relative cursor-pointer overflow-hidden"
                  onClick={() => handleLoadDesign(design.id)}
                >
                  {design.thumbnail ? (
                    <img
                      src={design.thumbnail}
                      alt={design.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: design.color }}
                    >
                      <svg
                        className="w-16 h-16 text-white/30"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 transition-all duration-300 text-sm font-medium transform scale-90 group-hover:scale-100">
                      Click to load
                    </span>
                  </div>
                </div>

                {/* Design Info */}
                <div className="p-4">
                  <h3 className="text-white font-semibold mb-2 truncate">
                    {design.name}
                  </h3>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs px-2.5 py-1 backdrop-blur-xl bg-white/10 text-gray-300 rounded-lg border border-white/10">
                      {shirtTypeLabels[design.shirtType] || "T-Shirt"}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {formatDate(design.createdAt)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLoadDesign(design.id)}
                      className="flex-1 px-3 py-2 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white text-sm rounded-xl transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => setDeleteId(design.id)}
                      className="px-3 py-2 backdrop-blur-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 text-sm rounded-xl transition-all duration-300 border border-white/10 hover:border-red-500/30"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 w-full max-w-md border border-white/20 shadow-2xl">
              <h2 className="text-2xl font-semibold text-white mb-3">
                Delete Design?
              </h2>
              <p className="text-gray-400 mb-6">
                This action cannot be undone. Are you sure you want to delete
                this design?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDelete(deleteId)}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 px-4 py-2.5 backdrop-blur-xl bg-white/10 hover:bg-white/15 text-gray-200 rounded-xl border border-white/20 transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyDesigns;

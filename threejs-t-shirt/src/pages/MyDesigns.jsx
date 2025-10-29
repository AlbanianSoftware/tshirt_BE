// pages/MyDesigns.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSnapshot } from "valtio";
import authState from "../store/authStore"; // Use your existing auth store

const MyDesigns = () => {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();
  const authSnap = useSnapshot(authState); // Use authState instead of useAuth

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
      console.log("Fetching designs...");
      const response = await fetch("http://localhost:3001/api/designs", {
        headers: {
          Authorization: `Bearer ${authSnap.token}`, // Use token from authState
        },
      });

      console.log("Fetch response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error(errorData.error || "Failed to fetch designs");
      }

      const data = await response.json();
      console.log("Designs fetched:", data);
      setDesigns(data);
    } catch (err) {
      console.error("Error fetching designs:", err);
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
          headers: {
            Authorization: `Bearer ${authSnap.token}`, // Use token from authState
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete design");
      }

      setDesigns(designs.filter((d) => d.id !== designId));
      setDeleteId(null);
    } catch (err) {
      console.error("Error deleting design:", err);
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

  // Redirect if not logged in
  if (!authSnap.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
          <svg
            className="w-16 h-16 mx-auto text-gray-600 mb-4"
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
          <h2 className="text-2xl font-bold text-gray-200 mb-2">
            Login Required
          </h2>
          <p className="text-gray-400 mb-6">
            Please log in to view your saved designs
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white 
                     rounded-lg transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-300 text-xl">Loading designs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-200">My Designs</h1>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white 
                     rounded-lg transition-colors flex items-center gap-2"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Design
          </button>
        </div>

        {error && (
          <div
            className="mb-6 p-4 bg-red-900/30 border border-red-700 
                       rounded-lg text-red-300"
          >
            {error}
          </div>
        )}

        {/* Designs Grid */}
        {designs.length === 0 ? (
          <div className="text-center py-20">
            <svg
              className="w-20 h-20 mx-auto text-gray-600 mb-4"
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
            <h2 className="text-xl text-gray-400 mb-2">No designs yet</h2>
            <p className="text-gray-500 mb-6">
              Create your first t-shirt design!
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white 
                       rounded-lg transition-colors"
            >
              Start Designing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {designs.map((design) => (
              <div
                key={design.id}
                className="bg-gray-800 rounded-lg border border-gray-700 
                         overflow-hidden hover:border-gray-600 transition-colors"
              >
                {/* Thumbnail */}
                <div
                  className="aspect-square bg-gray-700 relative cursor-pointer"
                  onClick={() => handleLoadDesign(design.id)}
                >
                  {design.thumbnail ? (
                    <img
                      src={design.thumbnail}
                      alt={design.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: design.color }}
                    >
                      <svg
                        className="w-16 h-16 text-white opacity-50"
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
                  <div
                    className="absolute inset-0 bg-black bg-opacity-0 
                                hover:bg-opacity-30 transition-opacity 
                                flex items-center justify-center"
                  >
                    <span
                      className="text-white opacity-0 hover:opacity-100 
                                   transition-opacity text-sm font-medium"
                    >
                      Click to load
                    </span>
                  </div>
                </div>

                {/* Design Info */}
                <div className="p-4">
                  <h3 className="text-gray-200 font-semibold mb-1 truncate">
                    {design.name}
                  </h3>
                  <p className="text-gray-500 text-sm mb-3">
                    {formatDate(design.createdAt)}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLoadDesign(design.id)}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 
                               text-white text-sm rounded-lg transition-colors"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => setDeleteId(design.id)}
                      className="px-3 py-2 bg-gray-700 hover:bg-red-600 
                               text-gray-300 hover:text-white text-sm rounded-lg 
                               transition-colors border border-gray-600"
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
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center 
                       justify-center z-50"
          >
            <div className="bg-gray-800 rounded-lg p-6 w-96 border border-gray-600">
              <h2 className="text-xl font-semibold text-gray-200 mb-4">
                Delete Design?
              </h2>
              <p className="text-gray-400 mb-6">
                This action cannot be undone. Are you sure you want to delete
                this design?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDelete(deleteId)}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 
                           text-white rounded-lg transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 
                           text-gray-200 rounded-lg border border-gray-600 
                           transition-colors"
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

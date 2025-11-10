// components/PublishDesignModal.jsx
import { useState, useEffect } from "react";
import { useSnapshot } from "valtio";
import authState from "../store/authStore";

const PublishDesignModal = ({ isOpen, onClose, onSuccess }) => {
  const authSnap = useSnapshot(authState);
  const [designs, setDesigns] = useState([]);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch user's designs
  useEffect(() => {
    if (isOpen && authSnap.token) {
      fetchDesigns();
    }
  }, [isOpen, authSnap.token]);

  const fetchDesigns = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3001/api/designs", {
        headers: {
          Authorization: `Bearer ${authSnap.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        // Handle both old array format and new object format
        if (Array.isArray(data)) {
          setDesigns(data);
        } else if (data.designs && Array.isArray(data.designs)) {
          setDesigns(data.designs);
        } else {
          setDesigns([]);
        }
      }
    } catch (error) {
      console.error("Error fetching designs:", error);
      setDesigns([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedDesign) {
      setMessage("Please select a design to publish");
      return;
    }

    if (!title.trim()) {
      setMessage("Please enter a title");
      return;
    }

    setPublishing(true);
    setMessage("");

    try {
      const response = await fetch("http://localhost:3001/api/community", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSnap.token}`,
        },
        body: JSON.stringify({
          designId: selectedDesign.id,
          title: title.trim(),
          description: description.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to publish");
      }

      setMessage("Design published successfully!");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error publishing:", error);
      setMessage(error.message);
    } finally {
      setPublishing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black/80 backdrop-blur-md rounded-xl max-w-2xl w-full border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              Publish to Community
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-lg transition-all duration-200 border border-transparent hover:border-white/10"
            >
              <svg
                className="w-5 h-5 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 mx-auto border-2 border-gray-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <div className="text-gray-400 text-sm">
                Loading your designs...
              </div>
            </div>
          ) : designs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4 text-sm">
                You don't have any saved designs yet.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200"
              >
                Create a Design First
              </button>
            </div>
          ) : (
            <>
              {/* Design Selection */}
              <div className="mb-6">
                <label className="block text-white font-medium mb-3 text-sm">
                  Select Design
                </label>
                <div className="grid grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                  {designs.map((design) => (
                    <button
                      key={design.id}
                      onClick={() => setSelectedDesign(design)}
                      className={`relative aspect-square rounded-lg overflow-hidden border transition-all
                        ${
                          selectedDesign?.id === design.id
                            ? "border-white/40 ring-1 ring-white/30"
                            : "border-white/10 hover:border-white/20"
                        }`}
                    >
                      {design.thumbnail ? (
                        <img
                          src={design.thumbnail}
                          alt={design.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-white/5 flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}

                      {/* Checkmark */}
                      {selectedDesign?.id === design.id && (
                        <div className="absolute inset-0 bg-white/10 flex items-center justify-center">
                          <div className="bg-white rounded-full p-1">
                            <svg
                              className="w-5 h-5 text-black"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        </div>
                      )}

                      {/* Design Name */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1 text-xs text-white truncate">
                        {design.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Input */}
              <div className="mb-4">
                <label className="block text-white font-medium mb-2 text-sm">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your design a title..."
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg 
                           text-white placeholder-gray-500 focus:outline-none focus:ring-1 
                           focus:ring-white/20 focus:bg-white/10 transition-all duration-200 text-sm"
                  maxLength={100}
                />
              </div>

              {/* Description Input */}
              <div className="mb-6">
                <label className="block text-white font-medium mb-2 text-sm">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell the community about your design..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg 
                           text-white placeholder-gray-500 focus:outline-none focus:ring-1 
                           focus:ring-white/20 focus:bg-white/10 resize-none transition-all duration-200 text-sm"
                  maxLength={500}
                />
              </div>

              {/* Message */}
              {message && (
                <div
                  className={`mb-4 p-3 rounded-lg text-sm border ${
                    message.includes("success")
                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}
                >
                  {message}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handlePublish}
                  disabled={publishing || !selectedDesign || !title.trim()}
                  className="flex-1 px-6 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-lg 
                           font-medium transition-all duration-200 disabled:opacity-40 
                           disabled:cursor-not-allowed border border-white/10 hover:border-white/20 text-sm"
                >
                  {publishing ? "Publishing..." : "Publish to Community"}
                </button>
                <button
                  onClick={onClose}
                  disabled={publishing}
                  className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 
                           rounded-lg border border-white/10 transition-all duration-200
                           disabled:opacity-40 text-sm"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublishDesignModal;

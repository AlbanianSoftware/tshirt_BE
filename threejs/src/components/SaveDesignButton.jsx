// components/SaveDesignButton.jsx
import React, { useState } from "react";
import { useSnapshot } from "valtio";
import authState from "../store/authStore";
import state from "../store";
import { markDesignAsSaved } from "../store/shirtCache";

const SaveDesignButton = ({ setCurrentDesignId }) => {
  const snap = useSnapshot(state);
  const authSnap = useSnapshot(authState);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [designName, setDesignName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Function to capture thumbnail from Three.js canvas
  const captureThumbnail = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return null;

    const thumbnailCanvas = document.createElement("canvas");
    thumbnailCanvas.width = 300;
    thumbnailCanvas.height = 300;
    const ctx = thumbnailCanvas.getContext("2d");
    ctx.drawImage(canvas, 0, 0, 300, 300);

    return thumbnailCanvas.toDataURL("image/jpeg", 0.7);
  };

  const handleSave = async () => {
    if (!designName.trim()) {
      setMessage("Please enter a design name");
      return;
    }

    if (!authSnap.isAuthenticated || !authSnap.token) {
      setMessage("Please log in to save designs");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const thumbnail = captureThumbnail();

      const designData = {
        name: designName,
        color: snap.color,
        shirtType: snap.shirtType,
        logoDecal: snap.logoDecal,
        fullDecal: snap.fullDecal,
        isLogoTexture: snap.isLogoTexture,
        isFullTexture: snap.isFullTexture,
        textData: snap.text,
        // ✨ NEW: Save logo transformation data
        logo: {
          url: snap.logo?.url || snap.logoDecal,
          scale: snap.logo?.scale || 1,
          position: snap.logo?.position || { x: 0, y: 0 },
          rotation: snap.logo?.rotation || 0,
          opacity: snap.logo?.opacity || 1,
          blur: snap.logo?.blur || 0,
          brightness: snap.logo?.brightness || 100,
          contrast: snap.logo?.contrast || 100,
          saturation: snap.logo?.saturation || 100,
        },
        thumbnail,
      };

      console.log("Saving design with logo data:", designData);

      const response = await fetch("http://localhost:3001/api/designs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSnap.token}`,
        },
        body: JSON.stringify(designData),
      });

      console.log("Response status:", response.status);
      const result = await response.json();
      console.log("Response data:", result);

      if (!response.ok) {
        throw new Error(result.error || "Failed to save design");
      }

      // Set the current design ID using designId from response
      if (result.designId && setCurrentDesignId) {
        setCurrentDesignId(result.designId);
        console.log("✅ Design ID set:", result.designId);
      }

      setMessage("Design saved successfully!");
      setTimeout(() => {
        setIsModalOpen(false);
        setDesignName("");
        setMessage("");
      }, 1500);
    } catch (error) {
      console.error("Error saving design:", error);
      setMessage(`Failed to save design: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Save Button - only show if logged in */}
      {authSnap.isAuthenticated ? (
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg 
                     border border-gray-600 transition-colors duration-200 
                     flex items-center gap-2"
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
              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
            />
          </svg>
          Save Design
        </button>
      ) : (
        <button
          className="px-4 py-2 bg-gray-800 text-gray-500 rounded-lg 
                     border border-gray-700 cursor-not-allowed flex items-center gap-2"
          disabled
          title="Please log in to save designs"
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
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          Save Design
        </button>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96 border border-gray-600">
            <h2 className="text-xl font-semibold text-gray-200 mb-4">
              Save Your Design
            </h2>

            <div className="mb-4">
              <label className="block text-gray-300 mb-2 text-sm">
                Design Name
              </label>
              <input
                type="text"
                value={designName}
                onChange={(e) => setDesignName(e.target.value)}
                placeholder="e.g., Summer Vibes Tee"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 
                         rounded-lg text-gray-200 placeholder-gray-500
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !isSaving) {
                    handleSave();
                  }
                }}
              />
            </div>

            {message && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm ${
                  message.includes("success")
                    ? "bg-green-900/30 text-green-300 border border-green-700"
                    : "bg-red-900/30 text-red-300 border border-red-700"
                }`}
              >
                {message}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 
                         text-white rounded-lg transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setDesignName("");
                  setMessage("");
                }}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 
                         text-gray-200 rounded-lg border border-gray-600 
                         transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
markDesignAsSaved();
export default SaveDesignButton;

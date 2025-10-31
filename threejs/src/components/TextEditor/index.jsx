import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSnapshot } from "valtio";
import state from "../../store";
import {
  generateTextTexture,
  validateTextConfig,
} from "../../utils/textureGenerator";
import TextControls from "./TextControls";
import PositionControls from "./PositionControls";
import TextStyleControls from "./TextStyleControls";
import TextPreview from "./TextPreview";
import CustomButton from "../CustomButton";

const TextEditor = ({ isOpen, onClose, onApply }) => {
  const snap = useSnapshot(state);
  const modalRef = useRef(null);

  // Local state for editing (only updates global state on apply)
  const [localText, setLocalText] = useState(snap.text);
  const [activeTab, setActiveTab] = useState("content");
  const [errors, setErrors] = useState([]);

  // Update localText when modal opens to sync with global state
  useEffect(() => {
    if (isOpen) {
      setLocalText({ ...snap.text });
      setErrors([]);
      setActiveTab("content");
    }
  }, [isOpen, snap.text]);

  // Handle text content change
  const handleTextChange = (value) => {
    setLocalText({ ...localText, content: value });
    setErrors([]);
  };

  // Handle any text property change
  const handlePropertyChange = (property, value) => {
    if (property.includes(".")) {
      const [parent, child] = property.split(".");
      setLocalText({
        ...localText,
        [parent]: {
          ...localText[parent],
          [child]: value,
        },
      });
    } else {
      setLocalText({ ...localText, [property]: value });
    }
  };

  // Apply changes to global state
  const handleApply = () => {
    const validation = validateTextConfig(localText);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    state.text = { ...localText };

    if (localText.content.trim()) {
      const textureUrl = generateTextTexture(localText);
      onApply(textureUrl);
    }

    onClose();
  };

  // Reset to original state
  const handleCancel = () => {
    setLocalText(snap.text);
    setErrors([]);
    onClose();
  };

  // Clear text - resets to initial state
  const handleClear = () => {
    const clearedText = {
      content: "",
      color: "#000000",
      size: 100,
      font: "Arial",
      position: { x: 50, y: 50 },
      rotation: 0,
      alignment: "center",
      style: {
        bold: true,
        italic: false,
        outline: false,
        outlineColor: "#ffffff",
        outlineWidth: 2,
        shadow: false,
        shadowColor: "#000000",
        shadowBlur: 4,
      },
    };
    setLocalText(clearedText);
  };

  // Handle backdrop click
  const handleOverlayClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      handleCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4"
        style={{ zIndex: 9999 }}
        onMouseDown={handleOverlayClick}
      >
        <motion.div
          ref={modalRef}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-700"
          style={{
            backdropFilter: "blur(10px)",
            background: "rgba(31, 41, 55, 0.95)",
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header */}

          {/* Tabs */}
          <div className="flex border-b border-gray-700 px-6 bg-gray-800/50">
            {[
              { id: "content", label: "Content & Style" },
              { id: "position", label: "Position & Size" },
              { id: "style", label: "Effects" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-medium transition-all ${
                  activeTab === tab.id
                    ? "text-white border-b-2 border-gray-400"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)] bg-gray-800/30 scrollbar-dark">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left side - Controls */}
              <div className="space-y-4">
                {activeTab === "content" && (
                  <TextControls
                    text={localText}
                    onTextChange={handleTextChange}
                    onPropertyChange={handlePropertyChange}
                  />
                )}

                {activeTab === "position" && (
                  <PositionControls
                    text={localText}
                    onPropertyChange={handlePropertyChange}
                  />
                )}

                {activeTab === "style" && (
                  <TextStyleControls
                    text={localText}
                    onPropertyChange={handlePropertyChange}
                  />
                )}

                {/* Error messages */}
                {errors.length > 0 && (
                  <div className="bg-red-900/30 border border-red-700 rounded-md p-3">
                    <p className="text-red-300 text-sm font-medium mb-1">
                      Please fix the following:
                    </p>
                    <ul className="text-red-200 text-sm list-disc list-inside">
                      {errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Right side - Preview */}
              <div>
                <TextPreview text={localText} />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-800/70 px-6 py-4 flex items-center justify-between border-t border-gray-700">
            <button
              onClick={handleClear}
              className="text-red-400 hover:text-red-300 font-medium text-sm transition-colors"
            >
              Clear Text
            </button>

            <div className="flex gap-3">
              <CustomButton
                type="outline"
                title="Cancel"
                handleClick={handleCancel}
                customStyles="px-6 py-2 text-sm"
              />
              <CustomButton
                type="filled"
                title="Apply Text"
                handleClick={handleApply}
                customStyles="px-6 py-2 text-sm"
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TextEditor;

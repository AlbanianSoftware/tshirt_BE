import { useState, useEffect } from "react";
import { useSnapshot } from "valtio";
import state from "../store";
import CustomButton from "./CustomButton";
import TextEditor from "./TextEditor";

const TextPicker = ({ applyText }) => {
  const snap = useSnapshot(state);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Automatically open editor when TextPicker is rendered
  useEffect(() => {
    setIsEditorOpen(true);
  }, []);

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
  };

  const handleApplyText = (textureUrl) => {
    applyText(textureUrl);
    setIsEditorOpen(false);
  };

  return (
    <>
      {/* Simple button panel - only shown when editor is closed */}
      {!isEditorOpen && (
        <div className="textpicker-container">
          <div className="flex flex-col gap-3 p-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Text Customization
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Add and customize text on your design with advanced controls
              </p>
            </div>

            {snap.text.content && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                <p className="text-xs text-blue-600 font-medium mb-1">
                  Current Text:
                </p>
                <p className="text-sm text-blue-900 font-semibold truncate">
                  {snap.text.content}
                </p>
              </div>
            )}

            <CustomButton
              type="filled"
              title={snap.text.content ? "Edit Text" : "Add Text"}
              handleClick={() => setIsEditorOpen(true)}
              customStyles="w-full px-4 py-3 font-bold text-sm"
            />

            {snap.text.content && (
              <button
                onClick={() => {
                  state.text.content = "";
                  applyText("");
                }}
                className="w-full px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
              >
                Remove Text
              </button>
            )}
          </div>
        </div>
      )}

      {/* Advanced Text Editor Modal */}
      <TextEditor
        isOpen={isEditorOpen}
        onClose={handleCloseEditor}
        onApply={handleApplyText}
      />
    </>
  );
};

export default TextPicker;

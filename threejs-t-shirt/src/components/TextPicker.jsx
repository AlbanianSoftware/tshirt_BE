import { useState } from "react";
import { useSnapshot } from "valtio";
import state from "../store";
import CustomButton from "./CustomButton";

const TextPicker = ({ applyText }) => {
  const snap = useSnapshot(state);
  const [text, setText] = useState(snap.customText || "");
  const [fontSize, setFontSize] = useState(snap.textSize || 100);
  const [textColor, setTextColor] = useState(snap.textColor || "#000000");
  const [fontFamily, setFontFamily] = useState(snap.textFont || "Arial");

  const handleApply = () => {
    state.customText = text;
    state.textSize = fontSize;
    state.textColor = textColor;
    state.textFont = fontFamily;

    if (text.trim()) {
      applyText();
    }
  };

  return (
    <div className="textpicker-container">
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Text</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter your text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 text-sm"
            maxLength={20}
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            Size: {fontSize}px
          </label>
          <input
            type="range"
            min="40"
            max="200"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Color</label>
          <input
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            className="w-full h-10 rounded cursor-pointer"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">Font</label>
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 text-sm"
          >
            <option value="Arial">Arial</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
            <option value="Impact">Impact</option>
            <option value="Comic Sans MS">Comic Sans</option>
          </select>
        </div>

        {text && (
          <div className="mt-2 p-3 bg-gray-100 rounded-md text-center">
            <p className="text-xs text-gray-500 mb-2">Preview:</p>
            <p
              style={{
                color: textColor,
                fontSize: `${fontSize / 5}px`,
                fontFamily: fontFamily,
                fontWeight: "bold",
              }}
            >
              {text}
            </p>
          </div>
        )}

        <CustomButton
          type="filled"
          title="Apply Text"
          handleClick={handleApply}
          customStyles="w-full px-4 py-2.5 font-bold text-sm"
        />
      </div>
    </div>
  );
};

export default TextPicker;

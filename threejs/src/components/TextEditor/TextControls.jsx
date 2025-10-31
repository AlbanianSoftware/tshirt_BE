import { getAvailableFonts } from "../../utils/textureGenerator";

const TextControls = ({ text, onTextChange, onPropertyChange }) => {
  const fonts = getAvailableFonts();

  return (
    <div className="space-y-4">
      {/* Text Input */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Text Content
        </label>
        <input
          type="text"
          value={text.content}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Enter your text..."
          className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-white placeholder-gray-400"
          maxLength={50}
        />
        <p className="text-xs text-gray-400 mt-1">
          {text.content.length}/50 characters
        </p>
      </div>

      {/* Font Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Font Family
        </label>
        <select
          value={text.font}
          onChange={(e) => onPropertyChange("font", e.target.value)}
          className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-white"
        >
          {fonts.map((font) => (
            <option key={font.value} value={font.value} className="bg-gray-800">
              {font.label}
            </option>
          ))}
        </select>
      </div>

      {/* Color Picker */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Text Color
        </label>
        <div className="flex gap-3 items-center">
          <input
            type="color"
            value={text.color}
            onChange={(e) => onPropertyChange("color", e.target.value)}
            className="h-12 w-20 rounded-lg cursor-pointer border border-gray-600 bg-gray-700"
          />
          <input
            type="text"
            value={text.color}
            onChange={(e) => onPropertyChange("color", e.target.value)}
            className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 text-white font-mono placeholder-gray-400"
            placeholder="#000000"
          />
        </div>
      </div>

      {/* Alignment */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Text Alignment
        </label>
        <div className="flex gap-2">
          {[
            { value: "left", label: "Left", icon: "⬅" },
            { value: "center", label: "Center", icon: "⬌" },
            { value: "right", label: "Right", icon: "➡" },
          ].map((align) => (
            <button
              key={align.value}
              onClick={() => onPropertyChange("alignment", align.value)}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                text.alignment === align.value
                  ? "border-gray-400 bg-gray-600/50 text-white"
                  : "border-gray-600 hover:border-gray-500 text-gray-300 hover:bg-gray-700/30"
              }`}
            >
              <span className="text-lg mr-2">{align.icon}</span>
              <span className="text-sm font-medium">{align.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Font Style Toggles */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Font Style
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => onPropertyChange("style.bold", !text.style.bold)}
            className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
              text.style.bold
                ? "border-gray-400 bg-gray-600/50 text-white"
                : "border-gray-600 hover:border-gray-500 text-gray-300 hover:bg-gray-700/30"
            }`}
          >
            <span className="font-bold text-sm">B</span>
            <span className="text-xs ml-2">Bold</span>
          </button>

          <button
            onClick={() => onPropertyChange("style.italic", !text.style.italic)}
            className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
              text.style.italic
                ? "border-gray-400 bg-gray-600/50 text-white"
                : "border-gray-600 hover:border-gray-500 text-gray-300 hover:bg-gray-700/30"
            }`}
          >
            <span className="italic text-sm">I</span>
            <span className="text-xs ml-2">Italic</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextControls;

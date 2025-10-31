const TextStyleControls = ({ text, onPropertyChange }) => {
  return (
    <div className="space-y-6">
      {/* Outline Toggle */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-300">
            Text Outline
          </label>
          <button
            onClick={() =>
              onPropertyChange("style.outline", !text.style.outline)
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              text.style.outline ? "bg-gray-600" : "bg-gray-700"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-gray-400 transition-transform ${
                text.style.outline ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {text.style.outline && (
          <div className="space-y-3 pl-4 border-l-2 border-gray-600">
            {/* Outline Color */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Outline Color
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={text.style.outlineColor}
                  onChange={(e) =>
                    onPropertyChange("style.outlineColor", e.target.value)
                  }
                  className="h-10 w-16 rounded cursor-pointer border border-gray-600 bg-gray-700"
                />
                <input
                  type="text"
                  value={text.style.outlineColor}
                  onChange={(e) =>
                    onPropertyChange("style.outlineColor", e.target.value)
                  }
                  className="flex-1 px-3 py-2 text-sm bg-gray-700/50 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 font-mono text-white"
                />
              </div>
            </div>

            {/* Outline Width */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Outline Width: {text.style.outlineWidth}px
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={text.style.outlineWidth}
                onChange={(e) =>
                  onPropertyChange("style.outlineWidth", Number(e.target.value))
                }
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                style={{
                  accentColor: "#6b7280",
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Shadow Toggle */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-300">
            Text Shadow
          </label>
          <button
            onClick={() => onPropertyChange("style.shadow", !text.style.shadow)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors border ${
              text.style.shadow
                ? "bg-gray-600 border-gray-500"
                : "bg-gray-800 border-gray-700"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                text.style.shadow
                  ? "translate-x-6 bg-gray-300"
                  : "translate-x-1 bg-gray-500"
              }`}
            />
          </button>
        </div>

        {text.style.shadow && (
          <div className="space-y-3 pl-4 border-l-2 border-gray-600">
            {/* Shadow Color */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Shadow Color
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={text.style.shadowColor}
                  onChange={(e) =>
                    onPropertyChange("style.shadowColor", e.target.value)
                  }
                  className="h-10 w-16 rounded cursor-pointer border border-gray-600 bg-gray-700"
                />
                <input
                  type="text"
                  value={text.style.shadowColor}
                  onChange={(e) =>
                    onPropertyChange("style.shadowColor", e.target.value)
                  }
                  className="flex-1 px-3 py-2 text-sm bg-gray-700/50 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 font-mono text-white"
                />
              </div>
            </div>

            {/* Shadow Blur */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Shadow Blur: {text.style.shadowBlur}px
              </label>
              <input
                type="range"
                min="0"
                max="20"
                value={text.style.shadowBlur}
                onChange={(e) =>
                  onPropertyChange("style.shadowBlur", Number(e.target.value))
                }
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                style={{
                  accentColor: "#6b7280",
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Style Presets */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Style Presets
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            {
              label: "None",
              outline: false,
              shadow: false,
            },
            {
              label: "Outlined",
              outline: true,
              outlineColor: "#ffffff",
              outlineWidth: 4,
              shadow: false,
            },
            {
              label: "Shadow",
              outline: false,
              shadow: true,
              shadowColor: "#000000",
              shadowBlur: 8,
            },
            {
              label: "Bold Effect",
              outline: true,
              outlineColor: "#000000",
              outlineWidth: 6,
              shadow: true,
              shadowColor: "#000000",
              shadowBlur: 4,
            },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                onPropertyChange("style.outline", preset.outline);
                onPropertyChange("style.shadow", preset.shadow);
                if (preset.outlineColor)
                  onPropertyChange("style.outlineColor", preset.outlineColor);
                if (preset.outlineWidth)
                  onPropertyChange("style.outlineWidth", preset.outlineWidth);
                if (preset.shadowColor)
                  onPropertyChange("style.shadowColor", preset.shadowColor);
                if (preset.shadowBlur)
                  onPropertyChange("style.shadowBlur", preset.shadowBlur);
              }}
              className="px-3 py-2 text-sm rounded-lg border bg-gray-700/30 border-gray-600 hover:border-gray-500 text-gray-300 hover:bg-gray-600/50 transition-all"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-3">
        <p className="text-xs text-gray-300">
          💡 <strong className="text-white">Tip:</strong> Combine outline and
          shadow for dramatic effects! Try white outline with dark shadow for
          maximum contrast.
        </p>
      </div>
    </div>
  );
};

export default TextStyleControls;

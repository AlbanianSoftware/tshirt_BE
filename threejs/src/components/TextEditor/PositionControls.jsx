const PositionControls = ({ text, onPropertyChange }) => {
  return (
    <div className="space-y-6">
      {/* Font Size */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Font Size: <span className="text-gray-100">{text.size}px</span>
        </label>
        <input
          type="range"
          min="20"
          max="300"
          value={text.size}
          onChange={(e) => onPropertyChange("size", Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-dark"
          style={{
            accentColor: "#6b7280",
          }}
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>20px</span>
          <span>300px</span>
        </div>
      </div>

      {/* Horizontal Position */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Horizontal Position:{" "}
          <span className="text-gray-100">{text.position.x}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={text.position.x}
          onChange={(e) =>
            onPropertyChange("position.x", Number(e.target.value))
          }
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-dark"
          style={{
            accentColor: "#6b7280",
          }}
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Left</span>
          <span>Center</span>
          <span>Right</span>
        </div>
      </div>

      {/* Vertical Position */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Vertical Position:{" "}
          <span className="text-gray-100">{text.position.y}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={text.position.y}
          onChange={(e) =>
            onPropertyChange("position.y", Number(e.target.value))
          }
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-dark"
          style={{
            accentColor: "#6b7280",
          }}
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Top</span>
          <span>Middle</span>
          <span>Bottom</span>
        </div>
      </div>

      {/* Rotation */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Rotation: <span className="text-gray-100">{text.rotation}°</span>
        </label>
        <input
          type="range"
          min="-180"
          max="180"
          value={text.rotation}
          onChange={(e) => onPropertyChange("rotation", Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-dark"
          style={{
            accentColor: "#6b7280",
          }}
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>-180°</span>
          <span>0°</span>
          <span>180°</span>
        </div>
      </div>

      {/* Quick Position Presets */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Quick Positions
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Top Left", x: 15, y: 15 },
            { label: "Top Center", x: 50, y: 15 },
            { label: "Top Right", x: 85, y: 15 },
            { label: "Middle Left", x: 15, y: 50 },
            { label: "Center", x: 50, y: 50 },
            { label: "Middle Right", x: 85, y: 50 },
            { label: "Bottom Left", x: 15, y: 85 },
            { label: "Bottom Center", x: 50, y: 85 },
            { label: "Bottom Right", x: 85, y: 85 },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                onPropertyChange("position.x", preset.x);
                onPropertyChange("position.y", preset.y);
              }}
              className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                text.position.x === preset.x && text.position.y === preset.y
                  ? "border-gray-500 bg-gray-600 text-white shadow-md"
                  : "border-gray-600 bg-gray-700/30 text-gray-300 hover:border-gray-500 hover:bg-gray-600/50"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={() => {
          onPropertyChange("position.x", 50);
          onPropertyChange("position.y", 50);
          onPropertyChange("rotation", 0);
          onPropertyChange("size", 100);
        }}
        className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors text-sm font-medium border border-gray-600"
      >
        Reset to Default
      </button>
    </div>
  );
};

export default PositionControls;

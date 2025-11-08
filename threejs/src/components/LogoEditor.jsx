import { useSnapshot } from "valtio";
import state from "../store";

const LogoEditor = ({ isOpen, onClose }) => {
  const snap = useSnapshot(state);

  if (!isOpen) {
    return null;
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      state.logo.url = url;
      state.logoDecal = url;

      if (!state.isLogoTexture) {
        state.isLogoTexture = true;
      }
    }
  };

  const handleScaleChange = (value) => {
    state.logo.scale = parseFloat(value);
  };

  const handlePositionXChange = (value) => {
    state.logo.position = { ...state.logo.position, x: parseInt(value) };
  };

  const handlePositionYChange = (value) => {
    state.logo.position = { ...state.logo.position, y: parseInt(value) };
  };

  const handleRotationChange = (value) => {
    state.logo.rotation = parseInt(value);
  };

  const handleReset = () => {
    state.logo.scale = 1;
    state.logo.position = { x: 0, y: 0 };
    state.logo.rotation = 0;
  };

  return (
    <div className="fixed left-0 top-0 bottom-0 z-[9999] flex items-center pl-24">
      <div className="bg-black/40 backdrop-blur-xl rounded-2xl shadow-2xl w-[380px] border border-white/10">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-lg"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* File Upload */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-200 mb-2">
              Upload Logo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl 
                       text-white text-xs file:mr-3 file:py-2 file:px-4 file:rounded-lg 
                       file:border-0 file:text-xs file:font-semibold 
                       file:bg-white/20 file:text-white hover:file:bg-white/30 
                       file:cursor-pointer cursor-pointer transition-all hover:border-white/20 backdrop-blur-sm"
            />
          </div>

          {/* Current Logo Preview */}
          {snap.logo.url && snap.logo.url !== "/albania.png" && (
            <div className="mb-5 p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
              <p className="text-xs text-gray-300 font-medium mb-3">Preview:</p>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <img
                  src={snap.logo.url}
                  alt="Logo preview"
                  className="w-28 h-28 object-contain mx-auto"
                />
              </div>
            </div>
          )}

          {/* Controls Container with scroll */}
          <div className="space-y-4 mb-5 max-h-[420px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-white/5 [&::-webkit-scrollbar-thumb]:bg-gray-500 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400">
            {/* Size */}
            <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-gray-200">
                  Size
                </span>
                <span className="text-xs text-white font-mono bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                  {snap.logo.scale.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min="0.01"
                max="2"
                step="0.01"
                value={snap.logo.scale}
                onChange={(e) => handleScaleChange(e.target.value)}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer 
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                         [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                         [&::-webkit-slider-thumb]:bg-white/70 [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-webkit-slider-thumb]:shadow-lg hover:[&::-webkit-slider-thumb]:bg-white
                         [&::-webkit-slider-thumb]:transition-all"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>0.01x</span>
                <span>2x</span>
              </div>
            </div>

            {/* Position X */}
            <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-gray-200">
                  Position X
                </span>
                <span className="text-xs text-white font-mono bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                  {snap.logo.position.x}px
                </span>
              </div>
              <input
                type="range"
                min="-200"
                max="200"
                step="5"
                value={snap.logo.position.x}
                onChange={(e) => handlePositionXChange(e.target.value)}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer 
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                         [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                         [&::-webkit-slider-thumb]:bg-white/70 [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-webkit-slider-thumb]:shadow-lg hover:[&::-webkit-slider-thumb]:bg-white
                         [&::-webkit-slider-thumb]:transition-all"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>-200px</span>
                <span>200px</span>
              </div>
            </div>

            {/* Position Y */}
            <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-gray-200">
                  Position Y
                </span>
                <span className="text-xs text-white font-mono bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                  {snap.logo.position.y}px
                </span>
              </div>
              <input
                type="range"
                min="-200"
                max="200"
                step="5"
                value={snap.logo.position.y}
                onChange={(e) => handlePositionYChange(e.target.value)}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer 
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                         [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                         [&::-webkit-slider-thumb]:bg-white/70 [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-webkit-slider-thumb]:shadow-lg hover:[&::-webkit-slider-thumb]:bg-white
                         [&::-webkit-slider-thumb]:transition-all"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>-200px</span>
                <span>200px</span>
              </div>
            </div>

            {/* Rotation */}
            <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-gray-200">
                  Rotation
                </span>
                <span className="text-xs text-white font-mono bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                  {snap.logo.rotation}°
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={snap.logo.rotation}
                onChange={(e) => handleRotationChange(e.target.value)}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer 
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                         [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                         [&::-webkit-slider-thumb]:bg-white/70 [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-webkit-slider-thumb]:shadow-lg hover:[&::-webkit-slider-thumb]:bg-white
                         [&::-webkit-slider-thumb]:transition-all"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>0°</span>
                <span>360°</span>
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="w-full px-4 py-3 text-sm text-white bg-white/10 hover:bg-white/20
                     rounded-xl transition-all border border-white/10 font-semibold
                     hover:border-white/20 shadow-lg backdrop-blur-sm"
          >
            Reset All Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoEditor;

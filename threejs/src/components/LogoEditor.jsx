import { useState, useEffect } from "react";
import { useSnapshot } from "valtio";
import state from "../store";

const LogoEditor = ({ isOpen, onClose }) => {
  const snap = useSnapshot(state);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      state.logo.url = url;
      state.logoDecal = url;

      // Make sure logo is visible
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
    <div className="fixed left-5 top-1/2 -translate-y-1/2 z-40">
      <div className="backdrop-blur-xl bg-black/80 rounded-2xl shadow-2xl w-[320px] border border-white/10">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Logo Settings</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
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
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-300 mb-2">
              Upload Logo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg 
                       text-white text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg 
                       file:border-0 file:text-xs file:font-medium 
                       file:bg-white/10 file:text-gray-300 hover:file:bg-white/20 
                       file:cursor-pointer cursor-pointer transition-all"
            />
          </div>

          {/* Controls */}
          <div className="space-y-3 mb-4">
            {/* Size */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-medium text-gray-300">Size</span>
                <span className="text-xs text-white font-mono bg-white/5 px-2 py-1 rounded">
                  {snap.logo.scale.toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={snap.logo.scale}
                onChange={(e) => handleScaleChange(e.target.value)}
                className="w-full h-1.5 bg-gray-700/50 rounded-full appearance-none cursor-pointer 
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 
                         [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full 
                         [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-webkit-slider-thumb]:shadow-lg hover:[&::-webkit-slider-thumb]:scale-110"
              />
            </div>

            {/* Position X */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-medium text-gray-300">
                  Position X
                </span>
                <span className="text-xs text-white font-mono bg-white/5 px-2 py-1 rounded">
                  {snap.logo.position.x}px
                </span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                step="5"
                value={snap.logo.position.x}
                onChange={(e) => handlePositionXChange(e.target.value)}
                className="w-full h-1.5 bg-gray-700/50 rounded-full appearance-none cursor-pointer 
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 
                         [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full 
                         [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-webkit-slider-thumb]:shadow-lg hover:[&::-webkit-slider-thumb]:scale-110"
              />
            </div>

            {/* Position Y */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-medium text-gray-300">
                  Position Y
                </span>
                <span className="text-xs text-white font-mono bg-white/5 px-2 py-1 rounded">
                  {snap.logo.position.y}px
                </span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                step="5"
                value={snap.logo.position.y}
                onChange={(e) => handlePositionYChange(e.target.value)}
                className="w-full h-1.5 bg-gray-700/50 rounded-full appearance-none cursor-pointer 
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 
                         [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full 
                         [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-webkit-slider-thumb]:shadow-lg hover:[&::-webkit-slider-thumb]:scale-110"
              />
            </div>

            {/* Rotation */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-medium text-gray-300">
                  Rotation
                </span>
                <span className="text-xs text-white font-mono bg-white/5 px-2 py-1 rounded">
                  {snap.logo.rotation}°
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                step="5"
                value={snap.logo.rotation}
                onChange={(e) => handleRotationChange(e.target.value)}
                className="w-full h-1.5 bg-gray-700/50 rounded-full appearance-none cursor-pointer 
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 
                         [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full 
                         [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer
                         [&::-webkit-slider-thumb]:shadow-lg hover:[&::-webkit-slider-thumb]:scale-110"
              />
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="w-full px-3 py-2 text-sm text-gray-300 hover:text-white 
                     hover:bg-white/10 rounded-lg transition-all border border-white/10
                     font-medium"
          >
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoEditor;

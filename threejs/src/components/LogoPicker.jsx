import { useState } from "react";
import { useSnapshot } from "valtio";
import state from "../store";
import CustomButton from "./CustomButton";
import LogoEditor from "./LogoEditor";

const LogoPicker = () => {
  const snap = useSnapshot(state);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  return (
    <>
      <div className="logopicker-container backdrop-blur-xl bg-black/40 rounded-2xl border border-white/10 shadow-2xl">
        <div className="flex flex-col gap-3 p-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-2">
              Logo Customization
            </h3>
            <p className="text-sm text-gray-300 mb-4">
              Add and customize your logo with size and position controls
            </p>
          </div>

          {snap.logo.url && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-2 backdrop-blur-sm">
              <p className="text-xs text-gray-300 font-medium mb-2">
                Current Logo:
              </p>
              <img
                src={snap.logo.url}
                alt="Logo preview"
                className="w-16 h-16 object-contain mx-auto"
              />
            </div>
          )}

          <CustomButton
            type="filled"
            title={snap.logo.url ? "Edit Logo" : "Add Logo"}
            handleClick={() => setIsEditorOpen(true)}
            customStyles="w-full px-4 py-3 font-bold text-sm"
          />

          {snap.logo.url && (
            <button
              onClick={() => {
                state.logo.url = "";
                state.logo.scale = 1;
                state.logo.position = { x: 0, y: 0 };
                state.logo.rotation = 0;
                state.logoDecal = "/albania.png";
              }}
              className="w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors border border-red-500/20"
            >
              Remove Logo
            </button>
          )}
        </div>
      </div>

      <LogoEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
      />
    </>
  );
};

export default LogoPicker;

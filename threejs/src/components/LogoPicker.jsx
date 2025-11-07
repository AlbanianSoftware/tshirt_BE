import { useSnapshot } from "valtio";
import state from "../store";

const LogoPicker = ({ onClose, onOpenEditor }) => {
  const snap = useSnapshot(state);

  console.log("LogoPicker rendered with props:", { onClose, onOpenEditor });

  const handleRemoveLogo = () => {
    state.logo.url = "";
    state.logo.scale = 1;
    state.logo.position = { x: 0, y: 0 };
    state.logo.rotation = 0;
    state.logoDecal = "/albania.png";
    state.isLogoTexture = false;
  };

  return (
    <div className="logopicker-container backdrop-blur-xl bg-black/40 rounded-2xl border border-white/10 shadow-2xl">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-semibold text-white">
            Logo Customization
          </h3>
          <button
            onClick={() => {
              console.log("Close button clicked");
              if (onClose) onClose();
            }}
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

        <p className="text-sm text-gray-300 mb-2">
          Add and customize your logo with size and position controls
        </p>

        {snap.logo.url && snap.logo.url !== "/albania.png" && (
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

        {/* SIMPLE BUTTON - NO CustomButton component */}
        <button
          onMouseEnter={() => console.log("Mouse entered button!")}
          onMouseDown={() => console.log("Mouse down on button!")}
          onMouseUp={() => console.log("Mouse up on button!")}
          onClick={() => {
            console.log("!!!!! LOGO EDITOR BUTTON CLICKED !!!!!");
            console.log("onOpenEditor exists?", !!onOpenEditor);
            if (onOpenEditor) {
              console.log("Calling onOpenEditor now...");
              onOpenEditor();
            } else {
              console.error("ERROR: onOpenEditor is undefined!");
            }
          }}
          style={{ pointerEvents: "auto", cursor: "pointer", zIndex: 9999 }}
          className="w-full px-4 py-3 bg-black text-white rounded-lg font-bold text-sm 
                     hover:bg-gray-800 transition-all border border-white/20"
        >
          {snap.logo.url && snap.logo.url !== "/albania.png"
            ? "Edit Logo"
            : "Add Logo"}
        </button>

        {snap.logo.url && snap.logo.url !== "/albania.png" && (
          <button
            onClick={handleRemoveLogo}
            className="w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors border border-red-500/20"
          >
            Remove Logo
          </button>
        )}
      </div>
    </div>
  );
};

export default LogoPicker;

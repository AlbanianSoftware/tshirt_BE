import React from "react";
import { useSnapshot } from "valtio";
import state from "../store";

const TShirtIcon = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
  </svg>
);

const WomanTShirtIcon = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.59 3.41L16 2a5 5 0 0 1-8 0L3.41 3.41a2 2 0 0 0-1.24 2.38l.8 4a1 1 0 0 0 .98.79H6v3l-1 8c0 1.1.9 2 2 2h10a2 2 0 0 0 2-2l-1-8v-3h2.05a1 1 0 0 0 .98-.79l.8-4a2 2 0 0 0-1.24-2.38z" />
  </svg>
);

const ShirtTypePicker = () => {
  const snap = useSnapshot(state);

  const shirtTypes = [
    {
      id: "tshirt",
      name: "Regular",
      icon: TShirtIcon,
    },
    {
      id: "female_tshirt",
      name: "Women's",
      icon: WomanTShirtIcon,
    },
  ];

  const handleShirtTypeChange = (type) => {
    state.shirtType = type;
  };

  return (
    <div className="absolute left-full ml-3 bg-white/10 backdrop-blur-md rounded-lg p-3 shadow-xl border border-white/20 w-[220px]">
      <div className="text-[10px] font-medium text-gray-300 uppercase tracking-wide mb-2">
        Style
      </div>
      <div className="flex gap-2">
        {shirtTypes.map((type) => {
          const Icon = type.icon;
          const isActive = snap.shirtType === type.id;
          return (
            <button
              key={type.id}
              onClick={() => handleShirtTypeChange(type.id)}
              className={`
                flex-1 flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg 
                transition-all duration-150 border backdrop-blur-sm
                ${
                  isActive
                    ? "bg-white/90 text-black border-white/50 shadow-lg"
                    : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:border-white/20"
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] font-medium">{type.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ShirtTypePicker;

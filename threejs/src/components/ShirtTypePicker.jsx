import React from "react";
import { useSnapshot } from "valtio";
import state from "../store";

const ShirtTypePicker = () => {
  const snap = useSnapshot(state);

  const shirtTypes = [
    { id: "tshirt", name: "T-Shirt", icon: "👕" },
    { id: "long_sleeve", name: "Long Sleeve", icon: "🧥" },
    { id: "female_tshirt", name: "Women's Fit", icon: "👚" },
  ];

  const handleShirtTypeChange = (type) => {
    state.shirtType = type;
  };

  return (
    <div className="shirttype-picker">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">Shirt Type</h3>
      <div className="grid grid-cols-1 gap-2">
        {shirtTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => handleShirtTypeChange(type.id)}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg transition-all
              ${
                snap.shirtType === type.id
                  ? "bg-blue-600 text-white border-2 border-blue-400"
                  : "bg-gray-700 text-gray-300 border-2 border-gray-600 hover:bg-gray-600"
              }
            `}
          >
            <span className="text-2xl">{type.icon}</span>
            <span className="font-medium text-sm">{type.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ShirtTypePicker;

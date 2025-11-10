import React from "react";
import { motion } from "framer-motion";

const shirtTypeLabels = {
  tshirt: "T-Shirt",
  long_sleeve: "Long Sleeve",
  female_tshirt: "Women's Fit",
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const DesignCard = ({ design, index, onLoad, onDelete }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 overflow-hidden hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-lg hover:shadow-2xl group"
    >
      {/* Thumbnail */}
      <div
        className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 relative cursor-pointer overflow-hidden"
        onClick={() => onLoad(design.id)}
      >
        {design.thumbnail ? (
          <img
            src={design.thumbnail}
            alt={design.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: design.color }}
          >
            <svg
              className="w-16 h-16 text-white/30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
              />
            </svg>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
          <span className="text-white opacity-0 group-hover:opacity-100 transition-all duration-300 text-sm font-medium transform scale-90 group-hover:scale-100">
            Click to load
          </span>
        </div>
      </div>

      {/* Design Info */}
      <div className="p-4">
        <h3 className="text-white font-semibold mb-2 truncate">
          {design.name}
        </h3>

        <div className="flex items-center justify-between mb-3">
          <span className="text-xs px-2.5 py-1 backdrop-blur-xl bg-white/10 text-gray-300 rounded-lg border border-white/10">
            {shirtTypeLabels[design.shirtType] || "T-Shirt"}
          </span>
          <span className="text-gray-500 text-xs">
            {formatDate(design.createdAt)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onLoad(design.id)}
            className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/15 text-white text-sm rounded-lg transition-all duration-200 border border-white/20 hover:border-white/30 font-medium"
          >
            Load
          </button>
          <button
            onClick={() => onDelete(design.id)}
            className="px-3 py-2 backdrop-blur-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 text-sm rounded-lg transition-all duration-300 border border-white/10 hover:border-red-500/30"
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default DesignCard;

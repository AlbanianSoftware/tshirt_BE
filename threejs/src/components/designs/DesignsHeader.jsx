// components/designs/DesignsHeader.jsx
import React from "react";
import { motion } from "framer-motion";

const DesignsHeader = ({ onBack, onNewDesign }) => {
  return (
    <motion.div
      className="sticky top-0 z-50 backdrop-blur-xl bg-black/60 border-b border-white/10"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/5 rounded-lg transition-all duration-200 border border-transparent hover:border-white/10"
            >
              <svg
                className="w-6 h-6 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                My Designs
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">
                Manage your saved designs
              </p>
            </div>
          </div>

          <button
            onClick={onNewDesign}
            className="px-5 py-2.5 bg-white/10 hover:bg-white/15 backdrop-blur-sm text-white rounded-lg transition-all duration-200 flex items-center gap-2 font-medium border border-white/20 hover:border-white/30 hover:shadow-lg hover:shadow-white/5"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Design
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default DesignsHeader;

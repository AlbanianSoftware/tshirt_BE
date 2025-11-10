// components/designs/EmptyState.jsx
import React from "react";
import { motion } from "framer-motion";

const EmptyState = ({ searchTerm, onAction }) => {
  return (
    <motion.div
      className="text-center py-20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
        <svg
          className="w-12 h-12 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">
        {searchTerm ? "No designs found" : "No designs yet"}
      </h2>
      <p className="text-gray-400 mb-6">
        {searchTerm
          ? "Try a different search term"
          : "Create your first t-shirt design!"}
      </p>
      <button
        onClick={onAction}
        className="px-6 py-3 bg-white/10 hover:bg-white/15 backdrop-blur-sm text-white rounded-lg font-medium transition-all duration-200 border border-white/20 hover:border-white/30 hover:shadow-lg hover:shadow-white/5"
      >
        {searchTerm ? "Clear Search" : "Start Designing"}
      </button>
    </motion.div>
  );
};

export default EmptyState;

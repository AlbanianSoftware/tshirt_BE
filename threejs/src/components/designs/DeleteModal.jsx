// components/designs/DeleteModal.jsx
import React from "react";
import { motion } from "framer-motion";

const DeleteModal = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="backdrop-blur-xl bg-white/10 rounded-2xl p-6 w-full max-w-md border border-white/20 shadow-2xl"
      >
        <h2 className="text-2xl font-semibold text-white mb-3">
          Delete Design?
        </h2>
        <p className="text-gray-400 mb-6">
          This action cannot be undone. Are you sure you want to delete this
          design?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg transition-all duration-300 font-medium border border-red-500/50"
          >
            Delete
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 backdrop-blur-xl bg-white/10 hover:bg-white/15 text-gray-200 rounded-lg border border-white/20 transition-all duration-300 font-medium"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default DeleteModal;

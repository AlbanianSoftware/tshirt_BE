// components/designs/DesignGrid.jsx
import React from "react";
import { motion } from "framer-motion";
import DesignCard from "./DesignCard";

const DesignGrid = ({ designs, onLoadDesign, onDeleteDesign }) => {
  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {designs.map((design, index) => (
        <DesignCard
          key={design.id}
          design={design}
          index={index}
          onLoad={onLoadDesign}
          onDelete={onDeleteDesign}
        />
      ))}
    </motion.div>
  );
};

export default DesignGrid;

import { motion } from "framer-motion";
import { slideAnimation } from "../../config/motion";
import { FilterTabs } from "../../config/constants";
import { downloadCanvasToImage } from "../../config/helpers";
import Tab from "../Tab";
import { download } from "../../assets";

const FilterControls = ({ activeFilterTab, onFilterTabClick }) => {
  return (
    <motion.div className="filtertabs-container" {...slideAnimation("up")}>
      {FilterTabs.map((tab) => (
        <Tab
          key={tab.name}
          tab={tab}
          isFilterTab
          isActiveTab={activeFilterTab[tab.name]}
          handleClick={() => onFilterTabClick(tab.name)}
        />
      ))}

      <button className="download-btn" onClick={downloadCanvasToImage}>
        <img
          src={download}
          alt="Download Image"
          className="w-3/5 h-3/5 object-contain"
        />
      </button>
    </motion.div>
  );
};

export default FilterControls;

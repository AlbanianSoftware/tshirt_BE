import { motion } from "framer-motion";
import { slideAnimation } from "../../config/motion";
import { EditorTabs } from "../../config/constants";
import Tab from "../Tab";
import ColorPicker from "../ColorPicker";
import FilePicker from "../FilePicker";
import ShirtTypePicker from "../ShirtTypePicker";
import stylishTshirt from "../../assets/stylish-tshirt.png";

const EditorSidebar = ({
  activeEditorTab,
  onTabClick,
  file,
  setFile,
  readFile,
  editorTabRef,
}) => {
  const generateTabContent = () => {
    switch (activeEditorTab) {
      case "colorpicker":
        return <ColorPicker />;
      case "filepicker":
        return <FilePicker file={file} setFile={setFile} readFile={readFile} />;
      case "textpicker":
        return null;
      case "logopicker":
        return null;
      case "shirttypepicker":
        return <ShirtTypePicker />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      key="custom"
      className="absolute top-0 left-0 z-10"
      {...slideAnimation("left")}
    >
      <div className="flex items-center min-h-screen" ref={editorTabRef}>
        <div className="editortabs-container tabs">
          {EditorTabs.map((tab) => (
            <Tab
              key={tab.name}
              tab={tab}
              handleClick={() => onTabClick(tab.name)}
            />
          ))}

          {/* Shirt Type Tab */}
          <Tab
            tab={{
              name: "shirttypepicker",
              icon: stylishTshirt,
            }}
            handleClick={() => onTabClick("shirttypepicker")}
          />

          {generateTabContent()}
        </div>
      </div>
    </motion.div>
  );
};

export default EditorSidebar;

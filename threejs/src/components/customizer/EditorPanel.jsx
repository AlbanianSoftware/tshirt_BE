import { motion } from "framer-motion";
import { slideAnimation } from "../../config/motion";
import { EditorTabs } from "../../config/constants";
import Tab from "../Tab";
import stylishTshirt from "../../assets/stylish-tshirt.png";
import changelogo from "../../assets/changelogo.png";
import ColorPicker from "../ColorPicker";
import FilePicker from "../FilePicker";
import ShirtTypePicker from "../ShirtTypePicker";
import { reader } from "../../config/helpers";
import { DecalTypes } from "../../config/constants";
import state from "../../store";

const EditorPanel = ({
  editorTabRef,
  handleTabClick,
  file,
  setFile,
  activeEditorTab,
  setActiveEditorTab,
}) => {
  const handleDecals = (type, result) => {
    const decalType = DecalTypes[type];
    state[decalType.stateProperty] = result;
  };

  const readFile = (type) => {
    reader(file).then((result) => {
      handleDecals(type, result);
      setActiveEditorTab("");
    });
  };

  const generateTabContent = () => {
    switch (activeEditorTab) {
      case "colorpicker":
        return <ColorPicker />;
      case "filepicker":
        return <FilePicker file={file} setFile={setFile} readFile={readFile} />;
      case "shirttypepicker":
        return <ShirtTypePicker />;
      case "textpicker":
      case "logopicker":
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
              handleClick={() => handleTabClick(tab.name)}
            />
          ))}

          <Tab
            tab={{
              name: "shirttypepicker",
              icon: stylishTshirt,
            }}
            handleClick={() => handleTabClick("shirttypepicker")}
          />

          {generateTabContent()}
        </div>
      </div>
    </motion.div>
  );
};

export default EditorPanel;

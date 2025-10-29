import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSnapshot } from "valtio";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import state from "../store";
import { download } from "../assets";
import authState from "../store/authStore"; // Use your existing auth
import { downloadCanvasToImage, reader } from "../config/helpers";
import { EditorTabs, FilterTabs, DecalTypes } from "../config/constants";
import { fadeAnimation, slideAnimation } from "../config/motion";
import {
  ColorPicker,
  CustomButton,
  FilePicker,
  Tab,
  TextPicker,
} from "../components";
import SaveDesignButton from "../components/SaveDesignButton";

const Customizer = () => {
  const navigate = useNavigate();
  const authSnap = useSnapshot(authState); // Use authState
  const snap = useSnapshot(state);
  const [file, setFile] = useState("");
  const [activeEditorTab, setActiveEditorTab] = useState("");
  const [activeFilterTab, setActiveFilterTab] = useState({
    logoShirt: true,
    stylishShirt: false,
  });

  const editorTabRef = useRef(null);

  // Apply text texture (called from TextPicker)
  const applyText = (textureUrl) => {
    if (textureUrl) {
      handleDecals("text", textureUrl);
    }
    setActiveEditorTab("");
  };

  // Closes the tab if clicked out
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        editorTabRef.current &&
        !editorTabRef.current.contains(event.target)
      ) {
        setActiveEditorTab("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // show tab content depending on the activeTab, or close it if clicked again
  const generateTabContent = () => {
    switch (activeEditorTab) {
      case "colorpicker":
        return <ColorPicker />;
      case "filepicker":
        return <FilePicker file={file} setFile={setFile} readFile={readFile} />;
      case "textpicker":
        return null; // TextPicker is rendered separately
      default:
        return null;
    }
  };

  // Handles click on tab: opens tab or closes it if clicked again
  const handleTabClick = (tabName) => {
    setActiveEditorTab((prevTab) => (prevTab === tabName ? "" : tabName));
  };

  const handleDecals = (type, result) => {
    const decalType = DecalTypes[type];
    state[decalType.stateProperty] = result;

    if (!activeFilterTab[decalType.filterTab]) {
      handleActiveFilterTab(decalType.filterTab);
    }
  };

  const handleActiveFilterTab = (tabName) => {
    switch (tabName) {
      case "logoShirt":
        state.isLogoTexture = !activeFilterTab[tabName];
        break;
      case "stylishShirt":
        state.isFullTexture = !activeFilterTab[tabName];
        break;
      default:
        state.isLogoTexture = true;
        state.isFullTexture = false;
        break;
    }

    setActiveFilterTab((prevState) => ({
      ...prevState,
      [tabName]: !prevState[tabName],
    }));
  };

  const readFile = (type) => {
    reader(file).then((result) => {
      handleDecals(type, result);
      setActiveEditorTab("");
    });
  };

  return (
    <AnimatePresence>
      {!snap.intro && (
        <>
          {/* left menu tabs */}
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

                {generateTabContent()}
              </div>
            </div>
          </motion.div>

          {/* TextPicker - rendered OUTSIDE the tabs container so modal isn't constrained */}
          {activeEditorTab === "textpicker" && (
            <TextPicker applyText={applyText} />
          )}

          {/* Top right buttons */}
          <motion.div
            className="absolute z-10 top-5 right-5 flex gap-3"
            {...fadeAnimation}
          >
            {/* My Designs Button */}
            <button
              onClick={() => navigate("/my-designs")}
              className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md 
                       border border-gray-600 transition-colors flex items-center gap-2 font-bold text-sm"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              My Designs
            </button>

            {/* Save Design Button */}
            <SaveDesignButton />

            {/* Go Back Button */}
            <CustomButton
              type="filled"
              title="Go Back"
              handleClick={() => (state.intro = true)}
              customStyles="w-fit px-4 py-2.5 font-bold text-sm"
            />
          </motion.div>

          {/* filter tabs */}
          <motion.div
            className="filtertabs-container"
            {...slideAnimation("up")}
          >
            {FilterTabs.map((tab) => (
              <Tab
                key={tab.name}
                tab={tab}
                isFilterTab
                isActiveTab={activeFilterTab[tab.name]}
                handleClick={() => handleActiveFilterTab(tab.name)}
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
        </>
      )}
    </AnimatePresence>
  );
};

export default Customizer;

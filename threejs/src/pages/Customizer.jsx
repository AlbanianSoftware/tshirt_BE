import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSnapshot } from "valtio";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import state from "../store";
import { download } from "../assets";
import authState from "../store/authStore";
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
import Cart from "../components/Cart";

const Customizer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const authSnap = useSnapshot(authState);
  const snap = useSnapshot(state);
  const [file, setFile] = useState("");
  const [activeEditorTab, setActiveEditorTab] = useState("");
  const [activeFilterTab, setActiveFilterTab] = useState({
    logoShirt: false,
    stylishShirt: false,
  });
  const [loadingDesign, setLoadingDesign] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [currentDesignId, setCurrentDesignId] = useState(null);

  const editorTabRef = useRef(null);

  // Load design from URL parameter
  useEffect(() => {
    const designId = searchParams.get("design");
    if (designId && authSnap.token) {
      setCurrentDesignId(parseInt(designId));
      loadDesign(designId);
    } else if (!designId) {
      setCurrentDesignId(null);
      state.isLogoTexture = false;
      state.isFullTexture = false;
    }
  }, [searchParams, authSnap.token]);

  // Function to load design from backend
  const loadDesign = async (designId) => {
    setLoadingDesign(true);
    try {
      console.log(`Loading design ${designId}...`);

      state.isLogoTexture = false;
      state.isFullTexture = false;
      console.log("Textures turned OFF");

      const response = await fetch(
        `http://localhost:3001/api/designs/${designId}`,
        {
          headers: {
            Authorization: `Bearer ${authSnap.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load design");
      }

      const design = await response.json();
      console.log("Design loaded:", design);

      if (design.color) {
        state.color = design.color;
        console.log("Applied color:", design.color);
      }

      if (design.logoDecal) {
        state.logoDecal = design.logoDecal;
      }
      state.isLogoTexture = design.isLogoTexture || false;

      if (design.fullDecal) {
        state.fullDecal = design.fullDecal;
      }
      state.isFullTexture = design.isFullTexture || false;

      setActiveFilterTab({
        logoShirt: design.isLogoTexture || false,
        stylishShirt: design.isFullTexture || false,
      });

      console.log("Design loaded successfully!");
    } catch (err) {
      console.error("Error loading design:", err);
      alert("Failed to load design. Please try again.");
    } finally {
      setLoadingDesign(false);
    }
  };

  // Handle adding to cart
  const addToCart = async () => {
    if (!currentDesignId) {
      alert("Please save your design first before adding to cart!");
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSnap.token}`,
        },
        body: JSON.stringify({ designId: currentDesignId }),
      });

      if (response.ok) {
        alert("Added to cart! 🛒");
      } else {
        alert("Failed to add to cart");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add to cart");
    }
  };

  const applyText = (textureUrl) => {
    if (textureUrl) {
      handleDecals("text", textureUrl);
    }
    setActiveEditorTab("");
  };

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

  const generateTabContent = () => {
    switch (activeEditorTab) {
      case "colorpicker":
        return <ColorPicker />;
      case "filepicker":
        return <FilePicker file={file} setFile={setFile} readFile={readFile} />;
      case "textpicker":
        return null;
      default:
        return null;
    }
  };

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
          {loadingDesign && (
            <motion.div
              className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 
                         bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg 
                         border border-gray-600"
              {...fadeAnimation}
            >
              Loading design...
            </motion.div>
          )}

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

          {activeEditorTab === "textpicker" && (
            <TextPicker applyText={applyText} />
          )}

          <motion.div
            className="absolute z-10 top-5 right-5 flex gap-3"
            {...fadeAnimation}
          >
            {/* View Cart Button */}
            <button
              onClick={() => setCartOpen(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md 
                       transition-colors flex items-center gap-2 font-bold text-sm"
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
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              View Cart
            </button>

            {currentDesignId && (
              <button
                onClick={addToCart}
                className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-md 
                         transition-colors flex items-center gap-2 font-bold text-sm"
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Add to Cart
              </button>
            )}

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

            <SaveDesignButton setCurrentDesignId={setCurrentDesignId} />

            <CustomButton
              type="filled"
              title="Go Back"
              handleClick={() => (state.intro = true)}
              customStyles="w-fit px-4 py-2.5 font-bold text-sm"
            />
          </motion.div>

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

          {/* Cart Component */}
          <Cart
            isOpen={cartOpen}
            onClose={() => setCartOpen(false)}
            token={authSnap.token}
          />
        </>
      )}
    </AnimatePresence>
  );
};

export default Customizer;

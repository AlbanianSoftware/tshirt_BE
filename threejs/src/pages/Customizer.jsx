import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useSnapshot } from "valtio";
import { useNavigate, useSearchParams } from "react-router-dom";

import state from "../store";
import { download } from "../assets";
import stylishTshirt from "../assets/stylish-tshirt.png";
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
  LogoPicker,
} from "../components";
import SaveDesignButton from "../components/SaveDesignButton";
import Cart from "../components/Cart";
import ShirtTypePicker from "../components/ShirtTypePicker.jsx";

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
  const [viewingCommunityDesign, setViewingCommunityDesign] = useState(false);

  const editorTabRef = useRef(null);
  const logoPickerRef = useRef(null);

  // Set intro to false when entering customizer
  useEffect(() => {
    state.intro = false;

    return () => {
      state.intro = true;
    };
  }, []);

  // Load design from URL parameter
  useEffect(() => {
    const designId = searchParams.get("design");
    const communityDesignId = searchParams.get("communityDesign");

    if (communityDesignId) {
      // Load community design (no auth needed)
      setViewingCommunityDesign(true);
      setCurrentDesignId(null); // Can't edit community designs
      loadCommunityDesign(communityDesignId);
    } else if (designId && authSnap.token) {
      // Load user's own design
      setViewingCommunityDesign(false);
      setCurrentDesignId(parseInt(designId));
      loadDesign(designId);
    } else if (!designId && !communityDesignId) {
      // Reset to default
      setViewingCommunityDesign(false);
      setCurrentDesignId(null);
      resetDesign();
    }
  }, [searchParams, authSnap.token]);

  // Reset design to defaults
  const resetDesign = () => {
    state.color = "#353934";
    state.isLogoTexture = false;
    state.isFullTexture = false;
    state.shirtType = "tshirt";
    state.logoDecal = "/albania.png";
    state.fullDecal = "/circuit.png";
    // Reset logo state
    state.logo = {
      url: "/albania.png",
      scale: 1,
      position: { x: 0, y: 0 },
      rotation: 0,
      opacity: 1,
    };
    setActiveFilterTab({
      logoShirt: false,
      stylishShirt: false,
    });
  };

  // Load community design (PUBLIC - no auth)
  const loadCommunityDesign = async (postId) => {
    setLoadingDesign(true);
    try {
      resetDesign();

      const response = await fetch(
        `http://localhost:3001/api/community/${postId}/design`
      );

      if (!response.ok) {
        throw new Error("Failed to load community design");
      }

      const design = await response.json();

      // Apply design
      if (design.shirtType) state.shirtType = design.shirtType;
      if (design.color) state.color = design.color;
      if (design.logoDecal) state.logoDecal = design.logoDecal;
      if (design.fullDecal) state.fullDecal = design.fullDecal;

      state.isLogoTexture = design.isLogoTexture || false;
      state.isFullTexture = design.isFullTexture || false;

      // Apply text data if exists
      if (design.textData) {
        state.text = { ...state.text, ...design.textData };
      }

      // Apply logo data if exists
      if (design.logoData) {
        state.logo = { ...state.logo, ...design.logoData };
      }

      setActiveFilterTab({
        logoShirt: design.isLogoTexture || false,
        stylishShirt: design.isFullTexture || false,
      });
    } catch (err) {
      console.error("Error loading community design:", err);
      alert("Failed to load community design. Please try again.");
    } finally {
      setLoadingDesign(false);
    }
  };

  // Load user's own design (requires auth)
  const loadDesign = async (designId) => {
    setLoadingDesign(true);
    try {
      resetDesign();

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

      if (design.shirtType) state.shirtType = design.shirtType;
      if (design.color) state.color = design.color;
      if (design.logoDecal) state.logoDecal = design.logoDecal;
      if (design.fullDecal) state.fullDecal = design.fullDecal;

      state.isLogoTexture = design.isLogoTexture || false;
      state.isFullTexture = design.isFullTexture || false;

      // Load logo data if exists
      if (design.logoData) {
        state.logo = { ...state.logo, ...design.logoData };
      }

      setActiveFilterTab({
        logoShirt: design.isLogoTexture || false,
        stylishShirt: design.isFullTexture || false,
      });
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
      // Don't close if clicking inside logo picker or editor tabs
      if (
        (editorTabRef.current && editorTabRef.current.contains(event.target)) ||
        (logoPickerRef.current && logoPickerRef.current.contains(event.target))
      ) {
        return;
      }

      // Only close textpicker, not logopicker (it has its own close button)
      if (activeEditorTab === "textpicker") {
        setActiveEditorTab("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeEditorTab]);

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
    <>
      {loadingDesign && (
        <motion.div
          className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 
                     backdrop-blur-xl bg-white/10 text-white px-6 py-3 rounded-xl shadow-2xl 
                     border border-white/20"
          {...fadeAnimation}
        >
          Loading design...
        </motion.div>
      )}

      {/* Community Design Banner */}
      {viewingCommunityDesign && (
        <motion.div
          className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 
               backdrop-blur-md bg-white/10 text-white px-6 py-3 rounded-lg shadow-xl 
               border border-white/20 flex items-center gap-2"
          {...fadeAnimation}
        >
          <svg
            className="w-5 h-5 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-medium text-sm">
            Viewing community design - Save it to edit and customize
          </span>
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

            {/* Shirt Type Tab */}
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

      {activeEditorTab === "textpicker" && <TextPicker applyText={applyText} />}

      {/* Logo Picker with ref */}
      <div ref={logoPickerRef}>
        {activeEditorTab === "logopicker" && (
          <LogoPicker onClose={() => setActiveEditorTab("")} />
        )}
      </div>

      <motion.div
        className="absolute z-10 top-5 right-5 flex gap-3"
        {...fadeAnimation}
      >
        {/* Community Button */}
        <button
          onClick={() => navigate("/community")}
          className="px-4 py-2.5 backdrop-blur-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 text-white rounded-xl 
                   border border-purple-500/30 transition-all duration-300 flex items-center gap-2 font-bold text-sm shadow-lg hover:shadow-purple-500/20"
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          Community
        </button>

        {/* View Cart Button */}
        <button
          onClick={() => setCartOpen(true)}
          className="px-4 py-2.5 backdrop-blur-xl bg-white/10 hover:bg-white/15 text-white rounded-xl 
                   transition-all duration-300 flex items-center gap-2 font-bold text-sm border border-white/10 shadow-lg"
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
            className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white rounded-xl 
                     transition-all duration-300 flex items-center gap-2 font-bold text-sm shadow-lg hover:shadow-xl"
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
          className="px-4 py-2.5 backdrop-blur-xl bg-white/10 hover:bg-white/15 text-white rounded-xl 
                   border border-white/10 transition-all duration-300 flex items-center gap-2 font-bold text-sm shadow-lg"
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
          handleClick={() => navigate("/")}
          customStyles="w-fit px-4 py-2.5 font-bold text-sm"
        />
      </motion.div>

      <motion.div className="filtertabs-container" {...slideAnimation("up")}>
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
  );
};

export default Customizer;

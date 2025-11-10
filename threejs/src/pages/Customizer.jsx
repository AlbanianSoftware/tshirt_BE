import { useState, useEffect } from "react";
import { useSnapshot } from "valtio";
import { useSearchParams } from "react-router-dom";

import state from "../store";
import authState from "../store/authStore";
import { reader } from "../config/helpers";
import { DecalTypes } from "../config/constants";
import { TextPicker } from "../components";
import LogoEditor from "../components/LogoEditor";
import Cart from "../components/Cart";

// Import cache utilities
import {
  setupShirtCache,
  restoreCachedShirt,
  clearShirtCache,
  hasCachedShirt,
} from "../store/shirtCache";

// Import refactored components
import CustomizerHeader from "../components/customizer/CustomizerHeader";
import EditorSidebar from "../components/customizer/EditorSidebar";
import FilterControls from "../components/customizer/FilterControls";
import StatusBanners from "../components/customizer/StatusBanners";

// Import custom hooks
import { useDesignLoader } from "../hooks/useDesignLoader";

const Customizer = () => {
  const [searchParams] = useSearchParams();
  const authSnap = useSnapshot(authState);

  // SIMPLE STATE
  const [currentTab, setCurrentTab] = useState("");
  const [file, setFile] = useState("");
  const [activeFilterTab, setActiveFilterTab] = useState({
    logoShirt: false,
    stylishShirt: false,
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [cacheRestored, setCacheRestored] = useState(false); // Track cache restoration

  const {
    loadingDesign,
    currentDesignId,
    setCurrentDesignId,
    viewingCommunityDesign,
    setViewingCommunityDesign,
    loadCommunityDesign,
    loadDesign,
    resetDesign,
  } = useDesignLoader(authSnap.token);

  // 🔧 CACHE SETUP: Start auto-save on mount
  useEffect(() => {
    const unsubscribe = setupShirtCache();
    console.log("✅ Cache system initialized");

    // Cleanup on unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Set intro to false when entering customizer
  useEffect(() => {
    state.intro = false;
    return () => {
      state.intro = true;
    };
  }, []);

  // 🔧 CACHE RESTORATION: Load cached design if no URL params
  useEffect(() => {
    const designId = searchParams.get("design");
    const communityDesignId = searchParams.get("communityDesign");

    const loadDesignData = async () => {
      if (communityDesignId) {
        // Loading community design - clear cache
        clearShirtCache();
        setViewingCommunityDesign(true);
        setCurrentDesignId(null);
        const filterTabs = await loadCommunityDesign(communityDesignId);
        if (filterTabs) setActiveFilterTab(filterTabs);
      } else if (designId && authSnap.token) {
        // Loading saved design - clear cache
        clearShirtCache();
        setViewingCommunityDesign(false);
        setCurrentDesignId(parseInt(designId));
        const filterTabs = await loadDesign(designId);
        if (filterTabs) setActiveFilterTab(filterTabs);
      } else if (!designId && !communityDesignId && !cacheRestored) {
        // No URL params - try to restore from cache
        setViewingCommunityDesign(false);
        setCurrentDesignId(null);

        const hasCache = hasCachedShirt();

        if (hasCache) {
          // Restore cached design
          const restored = restoreCachedShirt();
          if (restored) {
            console.log("🎨 Restored your previous design!");

            // Update filter tabs based on restored state
            setActiveFilterTab({
              logoShirt: state.isLogoTexture,
              stylishShirt: state.isFullTexture,
            });
          }
        } else {
          // No cache - reset to defaults
          resetDesign();
          setActiveFilterTab({
            logoShirt: false,
            stylishShirt: false,
          });
        }

        setCacheRestored(true);
      }
    };

    loadDesignData();
  }, [searchParams, authSnap.token, cacheRestored]);

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
    setCurrentTab("");
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
      setCurrentTab("");
    });
  };

  const handleTabClick = (tabName) => {
    setCurrentTab((prev) => (prev === tabName ? "" : tabName));
  };

  return (
    <>
      {/* Status Banners */}
      <StatusBanners
        loadingDesign={loadingDesign}
        viewingCommunityDesign={viewingCommunityDesign}
      />

      {/* Editor Sidebar */}
      <EditorSidebar
        activeEditorTab={currentTab}
        onTabClick={handleTabClick}
        file={file}
        setFile={setFile}
        readFile={readFile}
      />

      {/* Text Picker */}
      {currentTab === "textpicker" && <TextPicker applyText={applyText} />}

      {/* Logo Editor - Opens when logopicker tab is clicked */}
      {currentTab === "logopicker" && (
        <LogoEditor isOpen={true} onClose={() => setCurrentTab("")} />
      )}

      {/* Header with buttons */}
      <CustomizerHeader
        currentDesignId={currentDesignId}
        onAddToCart={addToCart}
        onOpenCart={() => setCartOpen(true)}
        setCurrentDesignId={setCurrentDesignId}
      />

      {/* Filter Controls */}
      <FilterControls
        activeFilterTab={activeFilterTab}
        onFilterTabClick={handleActiveFilterTab}
      />

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

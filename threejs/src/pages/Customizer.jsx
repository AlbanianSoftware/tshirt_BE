import { useState, useEffect } from "react";
import { useSnapshot } from "valtio";
import { useNavigate, useSearchParams } from "react-router-dom";

import state from "../store";
import authState from "../store/authStore";
import { reader } from "../config/helpers";
import { DecalTypes } from "../config/constants";
import { TextPicker, LogoPicker } from "../components";
import LogoEditor from "../components/LogoEditor";
import Cart from "../components/Cart";

// Import refactored components
import CustomizerHeader from "../components/customizer/CustomizerHeader";
import EditorSidebar from "../components/customizer/EditorSidebar";
import FilterControls from "../components/customizer/FilterControls";
import StatusBanners from "../components/customizer/StatusBanners";

// Import custom hooks
import { useDesignLoader } from "../hooks/useDesignLoader";
import { useEditorTabs } from "../hooks/useEditorTabs";

const Customizer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const authSnap = useSnapshot(authState);
  const snap = useSnapshot(state);

  const [file, setFile] = useState("");
  const [activeFilterTab, setActiveFilterTab] = useState({
    logoShirt: false,
    stylishShirt: false,
  });
  const [cartOpen, setCartOpen] = useState(false);

  // Use custom hooks
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

  const {
    activeEditorTab,
    setActiveEditorTab,
    logoEditorOpen,
    setLogoEditorOpen,
    handleTabClick,
    editorTabRef,
    logoPickerRef,
  } = useEditorTabs();

  console.log("logoEditorOpen state:", logoEditorOpen);

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

    const loadDesignData = async () => {
      if (communityDesignId) {
        setViewingCommunityDesign(true);
        setCurrentDesignId(null);
        const filterTabs = await loadCommunityDesign(communityDesignId);
        if (filterTabs) setActiveFilterTab(filterTabs);
      } else if (designId && authSnap.token) {
        setViewingCommunityDesign(false);
        setCurrentDesignId(parseInt(designId));
        const filterTabs = await loadDesign(designId);
        if (filterTabs) setActiveFilterTab(filterTabs);
      } else if (!designId && !communityDesignId) {
        setViewingCommunityDesign(false);
        setCurrentDesignId(null);
        resetDesign();
        setActiveFilterTab({
          logoShirt: false,
          stylishShirt: false,
        });
      }
    };

    loadDesignData();
  }, [searchParams, authSnap.token]);

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
      {/* Status Banners */}
      <StatusBanners
        loadingDesign={loadingDesign}
        viewingCommunityDesign={viewingCommunityDesign}
      />

      {/* Editor Sidebar */}
      <EditorSidebar
        activeEditorTab={activeEditorTab}
        onTabClick={handleTabClick}
        file={file}
        setFile={setFile}
        readFile={readFile}
        editorTabRef={editorTabRef}
      />

      {/* Text Picker */}
      {activeEditorTab === "textpicker" && <TextPicker applyText={applyText} />}

      {/* Logo Picker */}
      <div ref={logoPickerRef}>
        {activeEditorTab === "logopicker" && (
          <LogoPicker
            onClose={() => setActiveEditorTab("")}
            onOpenEditor={() => setLogoEditorOpen(true)}
          />
        )}
      </div>

      {/* Logo Editor - Rendered at root level */}
      {logoEditorOpen && (
        <LogoEditor
          isOpen={logoEditorOpen}
          onClose={() => setLogoEditorOpen(false)}
        />
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

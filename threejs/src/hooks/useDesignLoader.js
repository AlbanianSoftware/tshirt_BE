import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import state from "../store";

export const useDesignLoader = (token) => {
  const [searchParams] = useSearchParams();
  const [loadingDesign, setLoadingDesign] = useState(false);
  const [currentDesignId, setCurrentDesignId] = useState(null);
  const [viewingCommunityDesign, setViewingCommunityDesign] = useState(false);

  const resetDesign = () => {
    state.color = "#353934";
    state.isLogoTexture = false;
    state.isFullTexture = false;
    state.shirtType = "tshirt";
    state.logoDecal = "/albania.png";
    state.fullDecal = "/circuit.png";
    state.logoPosition = ["front"]; // ✨ Reset logo position
    state.logo = {
      url: "/albania.png",
      scale: 1,
      position: { x: 0, y: 0 },
      rotation: 0,
      opacity: 1,
      blur: 0,
      brightness: 100,
      contrast: 100,
      saturation: 100,
    };
  };

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

      if (design.shirtType) state.shirtType = design.shirtType;
      if (design.color) state.color = design.color;
      if (design.logoDecal) state.logoDecal = design.logoDecal;
      if (design.fullDecal) state.fullDecal = design.fullDecal;

      state.isLogoTexture = design.isLogoTexture || false;
      state.isFullTexture = design.isFullTexture || false;

      // ✨ FIXED: Restore logo position
      if (design.logoPosition && Array.isArray(design.logoPosition)) {
        state.logoPosition = design.logoPosition;
      }

      if (design.textData) {
        state.text = { ...state.text, ...design.textData };
      }

      // Check for both 'logo' and 'logoData' fields
      if (design.logo) {
        state.logo = {
          url: design.logo.url || design.logoDecal || "/albania.png",
          scale: design.logo.scale || 1,
          position: design.logo.position || { x: 0, y: 0 },
          rotation: design.logo.rotation || 0,
          opacity: design.logo.opacity || 1,
          blur: design.logo.blur || 0,
          brightness: design.logo.brightness || 100,
          contrast: design.logo.contrast || 100,
          saturation: design.logo.saturation || 100,
        };
      } else if (design.logoData) {
        // Fallback for old data structure
        state.logo = {
          url: design.logoData.url || design.logoDecal || "/albania.png",
          scale: design.logoData.scale || 1,
          position: design.logoData.position || { x: 0, y: 0 },
          rotation: design.logoData.rotation || 0,
          opacity: design.logoData.opacity || 1,
          blur: design.logoData.blur || 0,
          brightness: design.logoData.brightness || 100,
          contrast: design.logoData.contrast || 100,
          saturation: design.logoData.saturation || 100,
        };
      }

      console.log("✅ Loaded community design with logo data:", state.logo);
      console.log("✅ Logo positions:", state.logoPosition);

      return {
        logoShirt: design.isLogoTexture || false,
        stylishShirt: design.isFullTexture || false,
      };
    } catch (err) {
      console.error("Error loading community design:", err);
      alert("Failed to load community design. Please try again.");
      return null;
    } finally {
      setLoadingDesign(false);
    }
  };

  const loadDesign = async (designId) => {
    setLoadingDesign(true);
    try {
      resetDesign();

      const response = await fetch(
        `http://localhost:3001/api/designs/${designId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
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

      // ✨ FIXED: Restore logo position
      if (design.logoPosition && Array.isArray(design.logoPosition)) {
        state.logoPosition = design.logoPosition;
      }

      if (design.textData) {
        state.text = { ...state.text, ...design.textData };
      }

      // Check for both 'logo' and 'logoData' fields
      if (design.logo) {
        state.logo = {
          url: design.logo.url || design.logoDecal || "/albania.png",
          scale: design.logo.scale || 1,
          position: design.logo.position || { x: 0, y: 0 },
          rotation: design.logo.rotation || 0,
          opacity: design.logo.opacity || 1,
          blur: design.logo.blur || 0,
          brightness: design.logo.brightness || 100,
          contrast: design.logo.contrast || 100,
          saturation: design.logo.saturation || 100,
        };
      } else if (design.logoData) {
        // Fallback for old data structure
        state.logo = {
          url: design.logoData.url || design.logoDecal || "/albania.png",
          scale: design.logoData.scale || 1,
          position: design.logoData.position || { x: 0, y: 0 },
          rotation: design.logoData.rotation || 0,
          opacity: design.logoData.opacity || 1,
          blur: design.logoData.blur || 0,
          brightness: design.logoData.brightness || 100,
          contrast: design.logoData.contrast || 100,
          saturation: design.logoData.saturation || 100,
        };
      }

      console.log("✅ Loaded design with logo data:", state.logo);
      console.log("✅ Logo positions:", state.logoPosition);

      return {
        logoShirt: design.isLogoTexture || false,
        stylishShirt: design.isFullTexture || false,
      };
    } catch (err) {
      console.error("Error loading design:", err);
      alert("Failed to load design. Please try again.");
      return null;
    } finally {
      setLoadingDesign(false);
    }
  };

  return {
    loadingDesign,
    currentDesignId,
    setCurrentDesignId,
    viewingCommunityDesign,
    setViewingCommunityDesign,
    loadCommunityDesign,
    loadDesign,
    resetDesign,
  };
};

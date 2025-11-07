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
    state.logo = {
      url: "/albania.png",
      scale: 1,
      position: { x: 0, y: 0 },
      rotation: 0,
      opacity: 1,
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

      if (design.textData) {
        state.text = { ...state.text, ...design.textData };
      }

      if (design.logoData) {
        state.logo = { ...state.logo, ...design.logoData };
      }

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

      if (design.logoData) {
        state.logo = { ...state.logo, ...design.logoData };
      }

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

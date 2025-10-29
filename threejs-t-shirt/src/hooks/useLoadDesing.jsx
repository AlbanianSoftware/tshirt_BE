// hooks/useLoadDesign.js
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import state from "../store"; // Your Valtio state

const useLoadDesign = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const designId = searchParams.get("design");

    if (designId) {
      loadDesign(designId);
    }
  }, [searchParams]);

  const loadDesign = async (designId) => {
    try {
      const response = await fetch(`/api/designs/${designId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load design");
      }

      const design = await response.json();

      // Update Valtio state with loaded design
      state.color = design.color;
      state.logoDecal = design.logoDecal || "";
      state.fullDecal = design.fullDecal || "";
      state.isLogoTexture = design.isLogoTexture;
      state.isFullTexture = design.isFullTexture;

      // Load text data
      if (design.textData) {
        state.text = design.textData;
      }

      console.log("Design loaded successfully");
    } catch (error) {
      console.error("Error loading design:", error);
      alert("Failed to load design");
    }
  };

  return { loadDesign };
};

export default useLoadDesign;

// Usage in your Customizer component:
// import useLoadDesign from './hooks/useLoadDesign';
//
// const Customizer = () => {
//   useLoadDesign(); // This will automatically load design from URL params
//
//   // Rest of your component...
// }

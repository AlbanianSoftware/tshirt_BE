import { proxy } from "valtio";

const state = proxy({
  intro: true,
  color: "#353934",
  isLogoTexture: true,
  isFullTexture: false,
  // store/index.js
  logoDecal: "/albania.png", // Changed from "./albania.png"
  fullDecal: "/circuit.png", // Changed from "./circuit.png"
  // NEW: Shirt type selection
  shirtType: "tshirt", // 'tshirt', 'long_sleeve', 'female_tshirt'

  // Text configuration with advanced properties
  text: {
    content: "",
    color: "#000000",
    size: 100,
    font: "Arial",
    position: {
      x: 50, // percentage (0-100)
      y: 50, // percentage (0-100)
    },
    rotation: 0, // degrees
    alignment: "center", // "left", "center", "right"
    style: {
      bold: true,
      italic: false,
      outline: false,
      outlineColor: "#ffffff",
      outlineWidth: 2,
      shadow: false,
      shadowColor: "#000000",
      shadowBlur: 4,
    },
  },

  // Logo configuration with size and position controls
  logo: {
    url: "/albania.png", // Current logo URL
    scale: 1, // Size multiplier (0.1 - 3)
    position: {
      x: 0, // pixel offset from center (-200 to 200)
      y: 0, // pixel offset from center (-200 to 200)
    },
    rotation: 0, // degrees (0-360)
    opacity: 1, // transparency (0-1)
  },

  // Legacy support (can be removed later if not needed elsewhere)
  customText: "",
  textColor: "#000000",
  textSize: 100,
  textFont: "Arial",
});

export default state;

import { proxy } from "valtio";

const state = proxy({
  intro: true,
  color: "#353934",
  isLogoTexture: true,
  isFullTexture: false,
  logoDecal: "./albania.png",
  fullDecal: "./circuit.png",

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

  // Legacy support (can be removed later if not needed elsewhere)
  customText: "",
  textColor: "#000000",
  textSize: 100,
  textFont: "Arial",
});

export default state;

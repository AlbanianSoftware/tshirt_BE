import { proxy } from "valtio";

const state = proxy({
  intro: true,
  color: "#353934",
  isLogoTexture: true,
  isFullTexture: false,
  logoDecal: "/albania.png",
  fullDecal: "/circuit.png",
  shirtType: "tshirt", // 'tshirt', 'long_sleeve', 'female_tshirt'

  // NEW: Logo position control - can be array for multiple positions
  logoPosition: ["front"], // Options: 'front', 'back', 'leftSleeve', 'rightSleeve'

  // Text configuration with advanced properties
  text: {
    content: "",
    color: "#000000",
    size: 100,
    font: "Arial",
    position: {
      x: 50,
      y: 50,
    },
    rotation: 0,
    alignment: "center",
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
    url: "/albania.png",
    scale: 1,
    position: {
      x: 0,
      y: 0,
    },
    rotation: 0,
    opacity: 1,
  },

  // Legacy support
  customText: "",
  textColor: "#000000",
  textSize: 100,
  textFont: "Arial",
});

export default state;

import { proxy } from "valtio";

const state = proxy({
  intro: true,
  color: "#353934",
  isLogoTexture: true,
  isFullTexture: false,
  logoDecal: "./threejs.png",
  fullDecal: "./circuit.png",
  // Add these for text
  customText: "",
  textColor: "#000000",
  textSize: 100,
  textFont: "Arial",
});

export default state;

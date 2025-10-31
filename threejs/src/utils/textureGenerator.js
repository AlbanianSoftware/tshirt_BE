/**
 * Generates a texture image from text with advanced styling options
 * @param {Object} textConfig - Text configuration object
 * @returns {string} Base64 encoded image data URL
 */
export const generateTextTexture = (textConfig) => {
  const { content, color, size, font, position, rotation, alignment, style } =
    textConfig;

  // Create canvas
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Save context state
  ctx.save();

  // Calculate position (convert percentage to pixels)
  const x = (position.x / 100) * canvas.width;
  const y = (position.y / 100) * canvas.height;

  // Move to position and rotate
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);

  // Set font properties
  const fontWeight = style.bold ? "bold" : "normal";
  const fontStyle = style.italic ? "italic" : "normal";
  ctx.font = `${fontStyle} ${fontWeight} ${size}px ${font}`;
  ctx.textAlign = alignment;
  ctx.textBaseline = "middle";

  // Draw shadow if enabled
  if (style.shadow) {
    ctx.shadowColor = style.shadowColor;
    ctx.shadowBlur = style.shadowBlur;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
  }

  // Draw outline if enabled
  if (style.outline) {
    ctx.strokeStyle = style.outlineColor;
    ctx.lineWidth = style.outlineWidth;
    ctx.lineJoin = "round";
    ctx.miterLimit = 2;
    ctx.strokeText(content, 0, 0);
  }

  // Draw main text
  ctx.fillStyle = color;
  ctx.fillText(content, 0, 0);

  // Restore context
  ctx.restore();

  return canvas.toDataURL("image/png");
};

/**
 * Calculate optimal font size based on text length
 * @param {string} text - The text content
 * @param {number} currentSize - Current font size
 * @returns {number} Suggested font size
 */
export const calculateOptimalSize = (text, currentSize) => {
  if (!text) return currentSize;

  const baseSize = 100;
  const minSize = 40;
  const maxSize = 200;

  // Reduce size for longer text
  const lengthFactor = Math.max(1, text.length / 10);
  const suggestedSize = Math.floor(baseSize / Math.sqrt(lengthFactor));

  return Math.min(maxSize, Math.max(minSize, suggestedSize));
};

/**
 * Get available font families
 * @returns {Array} Array of font objects with name and display name
 */
export const getAvailableFonts = () => {
  return [
    { value: "Arial", label: "Arial" },
    { value: "Helvetica", label: "Helvetica" },
    { value: "Times New Roman", label: "Times New Roman" },
    { value: "Georgia", label: "Georgia" },
    { value: "Verdana", label: "Verdana" },
    { value: "Courier New", label: "Courier New" },
    { value: "Impact", label: "Impact" },
    { value: "Comic Sans MS", label: "Comic Sans MS" },
    { value: "Trebuchet MS", label: "Trebuchet MS" },
    { value: "Arial Black", label: "Arial Black" },
    { value: "Palatino", label: "Palatino" },
    { value: "Garamond", label: "Garamond" },
  ];
};

/**
 * Validate text configuration
 * @param {Object} textConfig - Text configuration to validate
 * @returns {Object} Validation result with isValid and errors
 */
export const validateTextConfig = (textConfig) => {
  const errors = [];

  if (!textConfig.content || textConfig.content.trim().length === 0) {
    errors.push("Text content is required");
  }

  if (textConfig.content.length > 50) {
    errors.push("Text is too long (max 50 characters)");
  }

  if (textConfig.size < 20 || textConfig.size > 300) {
    errors.push("Font size must be between 20 and 300");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

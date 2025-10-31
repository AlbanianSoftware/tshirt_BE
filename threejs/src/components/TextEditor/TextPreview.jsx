import { useEffect, useRef } from "react";

const TextPreview = ({ text }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background grid (darker for dark theme)
    ctx.strokeStyle = "#4b5563";
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Only draw text if content exists
    if (!text.content) return;

    // Calculate position
    const x = (text.position.x / 100) * canvas.width;
    const y = (text.position.y / 100) * canvas.height;

    // Save context
    ctx.save();

    // Transform for rotation
    ctx.translate(x, y);
    ctx.rotate((text.rotation * Math.PI) / 180);

    // Set font
    const fontWeight = text.style.bold ? "bold" : "normal";
    const fontStyle = text.style.italic ? "italic" : "normal";
    const fontSize = Math.floor(text.size / 3); // Scale down for preview
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${text.font}`;
    ctx.textAlign = text.alignment;
    ctx.textBaseline = "middle";

    // Draw shadow
    if (text.style.shadow) {
      ctx.shadowColor = text.style.shadowColor;
      ctx.shadowBlur = text.style.shadowBlur / 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
    }

    // Draw outline
    if (text.style.outline) {
      ctx.strokeStyle = text.style.outlineColor;
      ctx.lineWidth = text.style.outlineWidth / 2;
      ctx.lineJoin = "round";
      ctx.strokeText(text.content, 0, 0);
    }

    // Draw main text
    ctx.fillStyle = text.color;
    ctx.fillText(text.content, 0, 0);

    // Restore context
    ctx.restore();
  }, [text]);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-300">
        Live Preview
      </label>

      <div className="relative bg-gray-800/50 rounded-lg border-2 border-gray-600 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="w-full h-auto"
        />

        {!text.content && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-500 text-sm">Enter text to see preview</p>
          </div>
        )}
      </div>

      {/* Preview Info */}
      <div className="bg-gray-700/50 rounded-lg p-3 text-xs space-y-1 border border-gray-600">
        <div className="flex justify-between">
          <span className="text-gray-400">Position:</span>
          <span className="text-gray-200 font-mono">
            X: {text.position.x}%, Y: {text.position.y}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Size:</span>
          <span className="text-gray-200 font-mono">{text.size}px</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Rotation:</span>
          <span className="text-gray-200 font-mono">{text.rotation}°</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Effects:</span>
          <span className="text-gray-200">
            {text.style.outline && "Outline"}
            {text.style.outline && text.style.shadow && " + "}
            {text.style.shadow && "Shadow"}
            {!text.style.outline && !text.style.shadow && "None"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TextPreview;

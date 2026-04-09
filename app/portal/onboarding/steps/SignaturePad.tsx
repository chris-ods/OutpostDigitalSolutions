"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Props {
  name: string;
  onSignature: (dataUrl: string) => void;
}

export default function SignaturePad({ name, onSignature }: Props) {
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = useState(name);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasDrawn = useRef(false);

  // ── Canvas setup ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";
  }, [mode]);

  // ── Drawing handlers ──
  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    drawing.current = true;
    hasDrawn.current = true;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => {
    drawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn.current = false;
  };

  // ── Adopt signature ──
  const adoptSignature = useCallback(() => {
    if (mode === "draw") {
      if (!hasDrawn.current || !canvasRef.current) return;
      onSignature(canvasRef.current.toDataURL("image/png"));
    } else {
      // Render typed name on a canvas
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 120;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 600, 120);
      ctx.font = "italic 44px Georgia, 'Times New Roman', serif";
      ctx.fillStyle = "#111827";
      ctx.fillText(typedName, 20, 75);
      onSignature(canvas.toDataURL("image/png"));
    }
  }, [mode, typedName, onSignature]);

  const FONTS = [
    { label: "Script", style: "italic 36px Georgia, 'Times New Roman', serif" },
    { label: "Cursive", style: "italic 36px 'Brush Script MT', 'Segoe Script', cursive" },
    { label: "Formal", style: "italic 32px 'Palatino Linotype', 'Book Antiqua', serif" },
  ];
  const [fontIdx, setFontIdx] = useState(0);

  return (
    <div className="bg-app-surface-2 border border-app-border-2 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-app-border bg-app-surface flex items-center justify-between">
        <h3 className="text-sm font-bold text-app-text">Your Signature</h3>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMode("draw")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
              mode === "draw" ? "bg-app-accent text-white" : "bg-app-surface-2 text-app-text-3 hover:text-app-text"
            }`}
          >Draw</button>
          <button
            type="button"
            onClick={() => setMode("type")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
              mode === "type" ? "bg-app-accent text-white" : "bg-app-surface-2 text-app-text-3 hover:text-app-text"
            }`}
          >Type</button>
        </div>
      </div>

      <div className="p-5">
        {mode === "draw" ? (
          <div>
            <canvas
              ref={canvasRef}
              className="w-full bg-white rounded-lg border border-app-border-2 cursor-crosshair touch-none"
              style={{ height: "7.5rem" }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-app-text-4 text-xs">Draw your signature above</p>
              <button type="button" onClick={clearCanvas} className="text-app-text-4 hover:text-app-danger text-xs transition">
                Clear
              </button>
            </div>
          </div>
        ) : (
          <div>
            <input
              type="text"
              value={typedName}
              onChange={e => setTypedName(e.target.value)}
              placeholder="Type your full name"
              className="w-full px-4 py-2.5 bg-app-surface border border-app-border-2 rounded-lg text-app-text focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent transition mb-3"
            />
            {/* Preview */}
            <div className="bg-white rounded-lg border border-app-border-2 p-4 flex items-center justify-center" style={{ minHeight: "5rem" }}>
              <span style={{ font: FONTS[fontIdx].style, color: "#111827", fontSize: "2.25rem" }}>
                {typedName || name}
              </span>
            </div>
            {/* Font selector */}
            <div className="flex gap-2 mt-2">
              {FONTS.map((f, i) => (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => setFontIdx(i)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition ${
                    fontIdx === i ? "border-app-accent bg-app-accent/10 text-app-accent" : "border-app-border-2 text-app-text-4 hover:text-app-text"
                  }`}
                >
                  <span style={{ font: f.style.replace("36px", "14px") }}>{name.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={adoptSignature}
          disabled={mode === "type" && !typedName.trim()}
          className="w-full mt-4 py-2.5 bg-app-accent hover:bg-app-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition text-sm"
        >
          Adopt Signature
        </button>
      </div>
    </div>
  );
}

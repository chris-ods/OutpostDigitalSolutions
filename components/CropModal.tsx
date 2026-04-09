"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const SIZE   = 320;   // canvas display size (square)
const RADIUS = 130;   // crop-circle radius  → 260 px diameter, 30 px margin each side
const DIAM   = RADIUS * 2;
const OUTPUT = 400;   // exported JPEG size

interface Props {
  file: File;
  onCrop: (blob: Blob) => void;
  onCancel: () => void;
}

interface S {
  zoom: number;
  ox: number;
  oy: number;
  base: number; // scale that makes the image just cover the circle at zoom=1
  natW: number;
  natH: number;
}

export default function CropModal({ file, onCrop, onCancel }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const imgRef     = useRef<HTMLImageElement | null>(null);
  const stateRef   = useRef<S>({ zoom: 1, ox: 0, oy: 0, base: 1, natW: 1, natH: 1 });

  const dragging   = useRef(false);
  const lastPos    = useRef({ x: 0, y: 0 });
  const pinchDist  = useRef<number | null>(null);

  // React state only drives re-render (and therefore redraw)
  const [zoom,   setZoom]   = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [ready,  setReady]  = useState(false);

  // ── Load image ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const natW = img.naturalWidth;
      const natH = img.naturalHeight;
      const base = Math.max(DIAM / natW, DIAM / natH);
      imgRef.current = img;
      stateRef.current = { zoom: 1, ox: 0, oy: 0, base, natW, natH };
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setReady(true);
    };
    img.src = url;
    return () => { URL.revokeObjectURL(url); img.onload = null; };
  }, [file]);

  // ── Redraw canvas whenever transform changes ─────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    if (!canvas || !img || !ready) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { base, natW, natH } = stateRef.current;
    const scale  = base * zoom;
    const drawW  = natW * scale;
    const drawH  = natH * scale;
    const drawX  = SIZE / 2 - drawW / 2 + offset.x;
    const drawY  = SIZE / 2 - drawH / 2 + offset.y;

    // 1. Draw photo
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    // 2. Dark overlay with a circular hole (even-odd fill rule)
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, SIZE, SIZE);                          // outer rect (clockwise)
    ctx.arc(SIZE / 2, SIZE / 2, RADIUS, 0, Math.PI * 2, true); // circle hole (counter-clockwise)
    ctx.closePath();
    ctx.fillStyle = "rgba(0,0,0,0.58)";
    ctx.fill("evenodd");
    ctx.restore();

    // 3. Circle guide ring
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, RADIUS, 0, Math.PI * 2);
    ctx.stroke();
  }, [zoom, offset, ready]);

  // ── Clamp + commit ──────────────────────────────────────────────────────────
  const commit = useCallback((patch: Partial<S>) => {
    const s: S = { ...stateRef.current, ...patch };
    const scaledW = s.natW * s.base * s.zoom;
    const scaledH = s.natH * s.base * s.zoom;
    const maxX = Math.max(0, (scaledW - DIAM) / 2);
    const maxY = Math.max(0, (scaledH - DIAM) / 2);
    s.ox = Math.max(-maxX, Math.min(maxX, s.ox));
    s.oy = Math.max(-maxY, Math.min(maxY, s.oy));
    stateRef.current = s;
    setZoom(s.zoom);
    setOffset({ x: s.ox, y: s.oy });
  }, []);

  // ── Mouse drag ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      commit({
        ox: stateRef.current.ox + e.clientX - lastPos.current.x,
        oy: stateRef.current.oy + e.clientY - lastPos.current.y,
      });
      lastPos.current = { x: e.clientX, y: e.clientY };
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [commit]);

  // ── Scroll wheel zoom ───────────────────────────────────────────────────────
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const fn = (e: WheelEvent) => {
      e.preventDefault();
      commit({ zoom: Math.max(1, Math.min(4, stateRef.current.zoom - e.deltaY * 0.002)) });
    };
    el.addEventListener("wheel", fn, { passive: false });
    return () => el.removeEventListener("wheel", fn);
  }, [commit]);

  // ── Touch pan + pinch ───────────────────────────────────────────────────────
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        dragging.current = true;
        lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        pinchDist.current = null;
      } else if (e.touches.length === 2) {
        dragging.current = false;
        pinchDist.current = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
      }
    };
    const onMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1 && dragging.current) {
        commit({
          ox: stateRef.current.ox + e.touches[0].clientX - lastPos.current.x,
          oy: stateRef.current.oy + e.touches[0].clientY - lastPos.current.y,
        });
        lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2 && pinchDist.current) {
        const d = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
        commit({ zoom: Math.max(1, Math.min(4, stateRef.current.zoom * (d / pinchDist.current))) });
        pinchDist.current = d;
      }
    };
    const onEnd = () => { dragging.current = false; pinchDist.current = null; };
    el.addEventListener("touchstart",  onStart, { passive: true });
    el.addEventListener("touchmove",   onMove,  { passive: false });
    el.addEventListener("touchend",    onEnd,   { passive: true });
    return () => {
      el.removeEventListener("touchstart",  onStart);
      el.removeEventListener("touchmove",   onMove);
      el.removeEventListener("touchend",    onEnd);
    };
  }, [commit]);

  // ── Export ──────────────────────────────────────────────────────────────────
  const apply = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    const { zoom: z, ox, oy, base, natW, natH } = stateRef.current;

    const out = document.createElement("canvas");
    out.width  = OUTPUT;
    out.height = OUTPUT;
    const ctx = out.getContext("2d");
    if (!ctx) return;

    // Clip to circle
    ctx.beginPath();
    ctx.arc(OUTPUT / 2, OUTPUT / 2, OUTPUT / 2, 0, Math.PI * 2);
    ctx.clip();

    // Map crop circle back to source pixels
    const scale   = base * z;
    const srcSize = DIAM / scale;
    const srcX    = natW / 2 - ox / scale - srcSize / 2;
    const srcY    = natH / 2 - oy / scale - srcSize / 2;
    ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT, OUTPUT);

    out.toBlob((blob) => { if (blob) onCrop(blob); }, "image/jpeg", 0.92);
  }, [onCrop]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#111", borderRadius: 16,
        width: SIZE, overflow: "hidden",
        boxShadow: "0 24px 48px rgba(0,0,0,0.6)",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", borderBottom: "1px solid #222",
        }}>
          <button onClick={onCancel}
            style={{ background: "none", border: "none", color: "#888", fontSize: 14, cursor: "pointer" }}>
            Cancel
          </button>
          <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>Adjust Photo</span>
          <button onClick={apply}
            style={{ background: "none", border: "none", color: "#3b82f6", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Apply
          </button>
        </div>

        {/* Canvas preview */}
        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          style={{ display: "block", cursor: "grab" }}
          onMouseDown={(e) => {
            dragging.current = true;
            lastPos.current = { x: e.clientX, y: e.clientY };
          }}
        />

        {/* Zoom slider */}
        <div style={{ padding: "14px 20px 16px" }}>
          <input
            type="range" min={1} max={4} step={0.01} value={zoom}
            onChange={(e) => commit({ zoom: parseFloat(e.target.value) })}
            style={{ width: "100%", accentColor: "#3b82f6" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", color: "#555", fontSize: 12, marginTop: 4 }}>
            <span>Zoom</span><span>{zoom.toFixed(1)}×</span>
          </div>
        </div>
      </div>
    </div>
  );
}

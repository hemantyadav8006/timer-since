"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type ConfettiProps = {
  active: boolean;
  color?: string;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
};

const COLORS = [
  "#00FF88",
  "#FF6B9D",
  "#38BDF8",
  "#A78BFA",
  "#FBBF24",
  "#FB923C",
  "#F472B6",
  "#34D399",
];

/**
 * Canvas-based confetti burst. Portaled to document.body so it always covers
 * the viewport (avoids framer-motion transform / overflow clipping).
 */
export default function Confetti({ active, color }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    if (!active || !portalTarget) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    const palette = color ? [color, ...COLORS] : COLORS;

    const particles: Particle[] = Array.from({ length: 120 }, () => ({
      x: w * 0.5 + (Math.random() - 0.5) * 200,
      y: h * 0.45,
      vx: (Math.random() - 0.5) * 14,
      vy: -(Math.random() * 12 + 4),
      size: Math.random() * 6 + 3,
      color: palette[Math.floor(Math.random() * palette.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      opacity: 1,
    }));

    let raf = 0;
    let frame = 0;
    const maxFrames = 180;

    function draw() {
      ctx!.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx;
        p.vy += 0.25;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.opacity = Math.max(0, 1 - frame / maxFrames);

        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate((p.rotation * Math.PI) / 180);
        ctx!.globalAlpha = p.opacity;
        ctx!.fillStyle = p.color;
        ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx!.restore();
      }

      frame++;
      if (frame < maxFrames) {
        raf = requestAnimationFrame(draw);
      }
    }

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [active, color, portalTarget]);

  if (!active || !portalTarget) return null;

  return createPortal(
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-9999"
      aria-hidden="true"
    />,
    portalTarget,
  );
}

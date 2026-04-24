"use client";

import { useEffect, useRef } from "react";

/* ──────────────────────────────────────────────────────────
 *  ECGLine — full-screen canvas background that draws a
 *  continuous heartbeat monitor sweep with:
 *    • Realistic PQRST waveform shape
 *    • Smooth phosphor glow + afterglow fade trail
 *    • A bright sweep head dot
 *    • Faint medical-style grid in the background
 *  Runs entirely on rAF — zero framer-motion overhead.
 * ────────────────────────────────────────────────────────── */

// ── PQRST waveform definition ────────────────────────────
// Each segment is [dx, dy] relative to the previous point.
// The full beat spans ~200 units of x-space; baseline is y = 0.

function buildBeatPath(): { x: number; y: number }[] {
  // A single realistic PQRST complex. Y is inverted (negative = up).
  // Total dx ≈ 220 units
  const raw: [number, number][] = [
    // flat lead-in
    [0, 0],
    [30, 0],
    // P wave (small bump)
    [6, -4],
    [6, -8],
    [6, -6],
    [6, -2],
    [6, 0],
    // PR segment
    [14, 0],
    // Q dip
    [4, 6],
    // R spike (tall sharp peak)
    [5, -60],
    // S dip
    [5, 30],
    [4, 16],
    [3, 8],
    // ST segment (slight elevation)
    [10, -1],
    [8, -1],
    // T wave (broad bump)
    [6, -4],
    [6, -10],
    [8, -12],
    [8, -8],
    [6, -2],
    [6, 2],
    // flat lead-out
    [24, 0],
    [30, 0],
  ];

  const points: { x: number; y: number }[] = [];
  let cx = 0;
  let cy = 0;

  for (const [dx, dy] of raw) {
    cx += dx;
    cy += dy;
    points.push({ x: cx, y: cy });
  }

  return points;
}

const BEAT_POINTS = buildBeatPath();
const BEAT_WIDTH = BEAT_POINTS[BEAT_POINTS.length - 1].x;

/** Interpolate the waveform at arbitrary x within one beat. */
function sampleBeat(xInBeat: number): number {
  if (xInBeat <= 0) return BEAT_POINTS[0].y;
  if (xInBeat >= BEAT_WIDTH) return BEAT_POINTS[BEAT_POINTS.length - 1].y;

  for (let i = 1; i < BEAT_POINTS.length; i++) {
    const prev = BEAT_POINTS[i - 1];
    const cur = BEAT_POINTS[i];
    if (xInBeat <= cur.x) {
      const t = (xInBeat - prev.x) / (cur.x - prev.x);
      // Smooth cubic interpolation for natural curves
      const tSmooth = t * t * (3 - 2 * t);
      return prev.y + (cur.y - prev.y) * tSmooth;
    }
  }

  return 0;
}

// ── Constants ────────────────────────────────────────────

const SWEEP_SPEED = 120; // pixels per second
const GLOW_COLOR = "0, 255, 136";
const HEAD_RADIUS = 4;
const TRAIL_LENGTH = 0.55; // fraction of canvas width that glows behind the head
const AFTERGLOW_LENGTH = 0.85; // fraction that shows faint trace

// ── Grid renderer ────────────────────────────────────────

function drawGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  dpr: number,
) {
  const cellSize = 46 * dpr;

  // Sub-grid
  ctx.strokeStyle = `rgba(${GLOW_COLOR}, 0.04)`;
  ctx.lineWidth = 0.5 * dpr;
  ctx.beginPath();
  for (let x = 0; x < w; x += cellSize / 5) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = 0; y < h; y += cellSize / 5) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();

  // Main grid
  ctx.strokeStyle = `rgba(${GLOW_COLOR}, 0.08)`;
  ctx.lineWidth = 1 * dpr;
  ctx.beginPath();
  for (let x = 0; x < w; x += cellSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = 0; y < h; y += cellSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();
}

// ── Component ────────────────────────────────────────────

export default function ECGLine() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const gridCacheRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let baselineY = 0;
    let yScale = 1;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas!.getBoundingClientRect();
      w = rect.width * dpr;
      h = rect.height * dpr;
      canvas!.width = w;
      canvas!.height = h;
      baselineY = h * 0.52;
      yScale = h / 280;

      // Re-cache grid
      const gridCanvas = document.createElement("canvas");
      gridCanvas.width = w;
      gridCanvas.height = h;
      const gridCtx = gridCanvas.getContext("2d");
      if (gridCtx) {
        drawGrid(gridCtx, w, h, dpr);
      }
      gridCacheRef.current = gridCanvas;
    }

    resize();
    window.addEventListener("resize", resize);

    startTimeRef.current = performance.now();

    function draw(now: number) {
      const elapsed = (now - startTimeRef.current) / 1000;
      const sweepX = (elapsed * SWEEP_SPEED * dpr) % w;

      // Clear
      ctx!.clearRect(0, 0, w, h);

      // Radial vignette mask — fade grid at edges
      const gradient = ctx!.createRadialGradient(
        w * 0.5,
        h * 0.4,
        0,
        w * 0.5,
        h * 0.4,
        w * 0.6,
      );
      gradient.addColorStop(0, "rgba(0,0,0,1)");
      gradient.addColorStop(0.6, "rgba(0,0,0,0.7)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");

      ctx!.save();
      ctx!.globalCompositeOperation = "source-over";

      // Draw cached grid with vignette
      if (gridCacheRef.current) {
        ctx!.globalAlpha = 1;
        ctx!.drawImage(gridCacheRef.current, 0, 0);

        // Apply vignette as a destination-in mask
        ctx!.globalCompositeOperation = "destination-in";
        ctx!.fillStyle = gradient;
        ctx!.fillRect(0, 0, w, h);
      }

      ctx!.restore();

      // ── Draw waveform ───────────────────────────────────
      // We draw the full width of the canvas as a repeating waveform,
      // then apply brightness based on distance from the sweep head.

      const beatWidthPx = BEAT_WIDTH * dpr;

      for (let pass = 0; pass < 3; pass++) {
        // pass 0: dim afterglow trace (full path behind head)
        // pass 1: bright glowing trail
        // pass 2: baseline reference line

        ctx!.beginPath();

        const step = pass === 2 ? 8 * dpr : 2 * dpr;

        for (let px = 0; px < w; px += step) {
          const xInBeat = px % beatWidthPx;
          const sample = sampleBeat(xInBeat / dpr) * yScale;
          const py = baselineY + sample;

          // Distance from sweep head (wrapping)
          let dist = sweepX - px;
          if (dist < 0) dist += w;
          const frac = dist / w;

          let alpha = 0;

          if (pass === 0) {
            // Afterglow: everything behind the head, fading
            if (frac < AFTERGLOW_LENGTH) {
              alpha = 0.12 * (1 - frac / AFTERGLOW_LENGTH);
            }
          } else if (pass === 1) {
            // Bright trail
            if (frac < TRAIL_LENGTH) {
              alpha = 1.0 * Math.pow(1 - frac / TRAIL_LENGTH, 2.2);
            }
          } else {
            // Flat baseline
            alpha = 0.08;
          }

          if (alpha < 0.005) continue;

          if (pass === 2) {
            // Baseline is just a horizontal line
            if (px === 0) {
              ctx!.moveTo(0, baselineY);
            } else {
              ctx!.lineTo(px, baselineY);
            }
          } else {
            // Draw tiny segments with per-segment alpha
            const nextPx = px + step;
            const nextXInBeat = nextPx % beatWidthPx;
            const nextSample = sampleBeat(nextXInBeat / dpr) * yScale;
            const nextPy = baselineY + nextSample;

            ctx!.strokeStyle = `rgba(${GLOW_COLOR}, ${alpha.toFixed(3)})`;
            ctx!.lineWidth = pass === 1 ? 2.8 * dpr : 1.5 * dpr;
            ctx!.beginPath();
            ctx!.moveTo(px, py);
            ctx!.lineTo(nextPx, nextPy);
            ctx!.stroke();
          }
        }

        if (pass === 2) {
          ctx!.strokeStyle = `rgba(${GLOW_COLOR}, 0.08)`;
          ctx!.lineWidth = 1 * dpr;
          ctx!.stroke();
        }
      }

      // ── Glow layer: re-draw bright section with shadow ──
      {
        ctx!.save();
        ctx!.shadowColor = `rgba(${GLOW_COLOR}, 0.6)`;
        ctx!.shadowBlur = 16 * dpr;
        ctx!.lineWidth = 2.2 * dpr;

        const glowTrail = w * 0.12; // only the very tip glows intensely
        ctx!.beginPath();

        for (let px = 0; px < w; px += 2 * dpr) {
          let dist = sweepX - px;
          if (dist < 0) dist += w;
          if (dist > glowTrail) continue;

          const xInBeat = px % beatWidthPx;
          const sample = sampleBeat(xInBeat / dpr) * yScale;
          const py = baselineY + sample;

          const alpha = Math.pow(1 - dist / glowTrail, 1.8);
          ctx!.strokeStyle = `rgba(${GLOW_COLOR}, ${alpha.toFixed(3)})`;
          ctx!.beginPath();
          ctx!.moveTo(px, py);

          const nextPx = px + 2 * dpr;
          const nextXInBeat = nextPx % beatWidthPx;
          const nextSample = sampleBeat(nextXInBeat / dpr) * yScale;
          ctx!.lineTo(nextPx, baselineY + nextSample);
          ctx!.stroke();
        }

        ctx!.restore();
      }

      // ── Sweep head dot ──────────────────────────────────
      {
        const headXInBeat = sweepX % beatWidthPx;
        const headSample = sampleBeat(headXInBeat / dpr) * yScale;
        const headY = baselineY + headSample;
        const r = HEAD_RADIUS * dpr;

        // Outer glow
        ctx!.save();
        ctx!.shadowColor = `rgba(${GLOW_COLOR}, 0.9)`;
        ctx!.shadowBlur = 24 * dpr;
        ctx!.beginPath();
        ctx!.arc(sweepX, headY, r * 1.8, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${GLOW_COLOR}, 0.25)`;
        ctx!.fill();
        ctx!.restore();

        // Inner bright dot
        ctx!.beginPath();
        ctx!.arc(sweepX, headY, r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${GLOW_COLOR}, 0.95)`;
        ctx!.fill();

        // White-hot center
        ctx!.beginPath();
        ctx!.arc(sweepX, headY, r * 0.4, 0, Math.PI * 2);
        ctx!.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx!.fill();
      }

      // ── Dark wipe zone ahead of sweep ───────────────────
      // Creates the classic "eraser" look ahead of the head
      {
        const wipeWidth = w * 0.06;
        const wipeGrad = ctx!.createLinearGradient(
          sweepX,
          0,
          sweepX + wipeWidth,
          0,
        );
        wipeGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
        wipeGrad.addColorStop(0.4, "rgba(0, 0, 0, 0.7)");
        wipeGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx!.fillStyle = wipeGrad;
        ctx!.fillRect(sweepX, 0, wipeWidth, h);
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full opacity-50"
      aria-hidden="true"
    />
  );
}

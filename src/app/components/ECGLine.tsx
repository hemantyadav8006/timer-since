"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/app/providers/ThemeProvider";

/* ──────────────────────────────────────────────────────────
 *  ECGLine — hospital-monitor style background with 3 stacked
 *  waveform traces (ECG leads + pleth) sharing one sweep head.
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

function buildPlethPath(): { x: number; y: number }[] {
  const raw: [number, number][] = [
    [0, 0],
    [18, 0],
    [10, -6],
    [8, -22],
    [10, -28],
    [14, -18],
    [18, -6],
    [22, -1],
    [30, 0],
    [42, 0],
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

const PLETH_POINTS = buildPlethPath();
const PLETH_WIDTH = PLETH_POINTS[PLETH_POINTS.length - 1].x;

function buildWaveSampler(points: { x: number; y: number }[], width: number) {
  return (xInBeat: number): number => {
    if (xInBeat <= 0) return points[0].y;
    if (xInBeat >= width) return points[points.length - 1].y;

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const cur = points[i];
      if (xInBeat <= cur.x) {
        const t = (xInBeat - prev.x) / (cur.x - prev.x);
        const tSmooth = t * t * (3 - 2 * t);
        return prev.y + (cur.y - prev.y) * tSmooth;
      }
    }

    return 0;
  };
}

const sampleBeat = buildWaveSampler(BEAT_POINTS, BEAT_WIDTH);
const samplePleth = buildWaveSampler(PLETH_POINTS, PLETH_WIDTH);

// ── Constants ────────────────────────────────────────────

const SWEEP_SPEED = 120; // pixels per second
const GLOW_COLOR = "0, 255, 136";

function getEcgWipeColors(): { mid: string; clear: string } {
  const root = getComputedStyle(document.documentElement);
  return {
    mid: root.getPropertyValue("--ecg-wipe-mid").trim() || "rgba(0, 0, 0, 0.7)",
    clear:
      root.getPropertyValue("--ecg-wipe-clear").trim() || "rgba(0, 0, 0, 0)",
  };
}
const HEAD_RADIUS = 3;
const TRAIL_LENGTH = 0.55;
const AFTERGLOW_LENGTH = 0.85;
const TRACE_COUNT = 3;
const LANE_GAP_RATIO = 0.018;

type TraceConfig = {
  label: string;
  sample: (x: number) => number;
  beatWidth: number;
  amplitude: number;
  phase: number;
};

const TRACES: TraceConfig[] = [
  { label: "II", sample: sampleBeat, beatWidth: BEAT_WIDTH, amplitude: 0.9, phase: 0 },
  { label: "V", sample: sampleBeat, beatWidth: BEAT_WIDTH, amplitude: 0.7, phase: 48 },
  { label: "Pleth", sample: samplePleth, beatWidth: PLETH_WIDTH, amplitude: 1, phase: 0 },
];

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

function drawTrace(
  ctx: CanvasRenderingContext2D,
  w: number,
  sweepX: number,
  baselineY: number,
  laneHeight: number,
  trace: TraceConfig,
  dpr: number,
) {
  const beatWidthPx = trace.beatWidth * dpr;
  const yScale = (laneHeight / 300) * trace.amplitude;
  const phasePx = trace.phase * dpr;

  const sampleAt = (px: number) => {
    const xInBeat = (px + phasePx) % beatWidthPx;
    return trace.sample(xInBeat / dpr) * yScale;
  };

  ctx.beginPath();
  ctx.moveTo(0, baselineY);
  ctx.lineTo(w, baselineY);
  ctx.strokeStyle = `rgba(${GLOW_COLOR}, 0.08)`;
  ctx.lineWidth = 1 * dpr;
  ctx.stroke();

  for (let pass = 0; pass < 2; pass++) {
    const step = 2 * dpr;

    for (let px = 0; px < w; px += step) {
      const py = baselineY + sampleAt(px);

      let dist = sweepX - px;
      if (dist < 0) dist += w;
      const frac = dist / w;

      let alpha = 0;
      if (pass === 0) {
        if (frac < AFTERGLOW_LENGTH) {
          alpha = 0.12 * (1 - frac / AFTERGLOW_LENGTH);
        }
      } else if (frac < TRAIL_LENGTH) {
        alpha = 1.0 * Math.pow(1 - frac / TRAIL_LENGTH, 2.2);
      }

      if (alpha < 0.005) continue;

      const nextPx = px + step;
      ctx.strokeStyle = `rgba(${GLOW_COLOR}, ${alpha.toFixed(3)})`;
      ctx.lineWidth = pass === 1 ? 2.4 * dpr : 1.4 * dpr;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(nextPx, baselineY + sampleAt(nextPx));
      ctx.stroke();
    }
  }

  ctx.save();
  ctx.shadowColor = `rgba(${GLOW_COLOR}, 0.6)`;
  ctx.shadowBlur = 14 * dpr;
  ctx.lineWidth = 2 * dpr;

  const glowTrail = w * 0.12;
  for (let px = 0; px < w; px += 2 * dpr) {
    let dist = sweepX - px;
    if (dist < 0) dist += w;
    if (dist > glowTrail) continue;

    const alpha = Math.pow(1 - dist / glowTrail, 1.8);
    ctx.strokeStyle = `rgba(${GLOW_COLOR}, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(px, baselineY + sampleAt(px));
    const nextPx = px + 2 * dpr;
    ctx.lineTo(nextPx, baselineY + sampleAt(nextPx));
    ctx.stroke();
  }
  ctx.restore();

  const headSample = sampleAt(sweepX);
  const headY = baselineY + headSample;
  const r = HEAD_RADIUS * dpr;

  ctx.save();
  ctx.shadowColor = `rgba(${GLOW_COLOR}, 0.9)`;
  ctx.shadowBlur = 20 * dpr;
  ctx.beginPath();
  ctx.arc(sweepX, headY, r * 1.8, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${GLOW_COLOR}, 0.25)`;
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(sweepX, headY, r, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${GLOW_COLOR}, 0.95)`;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(sweepX, headY, r * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.fill();
}

// ── Component ────────────────────────────────────────────

export default function ECGLine() {
  const { colorMode } = useTheme();
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
    let laneHeight = 0;
    let laneGap = 0;
    let laneBaselines: number[] = [];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas!.getBoundingClientRect();
      w = rect.width * dpr;
      h = rect.height * dpr;
      canvas!.width = w;
      canvas!.height = h;

      laneGap = h * LANE_GAP_RATIO;
      laneHeight = (h - laneGap * (TRACE_COUNT - 1)) / TRACE_COUNT;
      laneBaselines = TRACES.map((_, i) => {
        const laneTop = i * (laneHeight + laneGap);
        return laneTop + laneHeight * 0.58;
      });

      const gridCanvas = document.createElement("canvas");
      gridCanvas.width = w;
      gridCanvas.height = h;
      const gridCtx = gridCanvas.getContext("2d");
      if (gridCtx) {
        drawGrid(gridCtx, w, h, dpr);

        gridCtx.strokeStyle = `rgba(${GLOW_COLOR}, 0.12)`;
        gridCtx.lineWidth = 1 * dpr;
        for (let i = 1; i < TRACE_COUNT; i++) {
          const y = i * laneHeight + (i - 1) * laneGap;
          gridCtx.beginPath();
          gridCtx.moveTo(0, y);
          gridCtx.lineTo(w, y);
          gridCtx.stroke();
        }
      }
      gridCacheRef.current = gridCanvas;
    }

    resize();
    window.addEventListener("resize", resize);

    startTimeRef.current = performance.now();

    // Pause animation when tab is hidden to save CPU/battery
    let paused = false;
    let pauseStart = 0;
    let totalPaused = 0;

    function onVisibilityChange() {
      if (document.hidden) {
        paused = true;
        pauseStart = performance.now();
        cancelAnimationFrame(rafRef.current);
      } else {
        totalPaused += performance.now() - pauseStart;
        paused = false;
        rafRef.current = requestAnimationFrame(draw);
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);

    function draw(now: number) {
      const elapsed = (now - startTimeRef.current - totalPaused) / 1000;
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

      ctx!.font = `${11 * dpr}px ui-monospace, monospace`;
      ctx!.fillStyle = `rgba(${GLOW_COLOR}, 0.35)`;
      TRACES.forEach((trace, i) => {
        const laneTop = i * (laneHeight + laneGap);
        ctx!.fillText(trace.label, 12 * dpr, laneTop + 18 * dpr);
      });

      TRACES.forEach((trace, i) => {
        drawTrace(
          ctx!,
          w,
          sweepX,
          laneBaselines[i],
          laneHeight,
          trace,
          dpr,
        );
      });

      // ── Wipe zone ahead of sweep (dark mode only — eraser on monitor) ──
      if (document.documentElement.classList.contains("dark")) {
        const wipeWidth = w * 0.06;
        const { mid: wipeMid, clear: wipeClear } = getEcgWipeColors();
        const wipeGrad = ctx!.createLinearGradient(
          sweepX,
          0,
          sweepX + wipeWidth,
          0,
        );
        wipeGrad.addColorStop(0, wipeClear);
        wipeGrad.addColorStop(0.4, wipeMid);
        wipeGrad.addColorStop(1, wipeClear);
        ctx!.fillStyle = wipeGrad;
        ctx!.fillRect(sweepX, 0, wipeWidth, h);
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [colorMode]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ opacity: "var(--ecg-opacity)" }}
      aria-hidden="true"
    />
  );
}

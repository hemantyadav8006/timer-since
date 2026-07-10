"use client";

import type { CSSProperties } from "react";

type FloatingGeometricShapesProps = {
  mounted?: boolean;
};

type ShapeConfig = {
  className: string;
  delay: string;
  animation: string;
  style?: CSSProperties;
};

const SHAPES: ShapeConfig[] = [
  {
    className:
      "top-[12%] left-[6%] h-28 w-28 border-2 border-emerald-400/20 rotate-45",
    delay: "200ms",
    animation: "shape-float 6s ease-in-out infinite",
  },
  {
    className:
      "bottom-[14%] right-[5%] h-20 w-20 rounded-full border-2 border-cyan-400/20",
    delay: "400ms",
    animation: "shape-float 8s ease-in-out infinite reverse",
  },
  {
    className:
      "top-1/2 right-[10%] h-14 w-14 rotate-12 bg-gradient-to-br from-emerald-300/25 to-teal-300/20",
    delay: "600ms",
    animation: "shape-rotate 10s linear infinite",
  },
  {
    className:
      "top-[18%] right-[22%] h-0 w-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-b-[30px] border-b-emerald-400/20",
    delay: "800ms",
    animation:
      "shape-float 7s ease-in-out infinite, shape-rotate 15s linear infinite",
  },
  {
    className:
      "bottom-[22%] left-[14%] h-16 w-16 bg-gradient-to-br from-teal-300/20 to-cyan-300/20",
    delay: "1000ms",
    animation:
      "shape-float 9s ease-in-out infinite, shape-pulse 4s ease-in-out infinite",
    style: {
      clipPath: "polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)",
    },
  },
  {
    className:
      "top-[10%] left-1/2 h-10 w-10 -translate-x-1/2 rounded-full border-2 border-emerald-300/25",
    delay: "1200ms",
    animation:
      "shape-float 5s ease-in-out infinite, shape-rotate 20s linear infinite reverse",
  },
  {
    className:
      "bottom-[8%] left-1/2 h-36 w-36 -translate-x-1/2 rotate-12 border-2 border-emerald-400/12",
    delay: "1400ms",
    animation:
      "shape-float 11s ease-in-out infinite reverse, shape-rotate 25s linear infinite",
  },
  {
    className:
      "top-1/2 left-[5%] h-0 w-0 -translate-y-1/2 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-b-[22px] border-b-teal-400/20",
    delay: "1600ms",
    animation:
      "shape-float 6.5s ease-in-out infinite, shape-rotate 12s linear infinite reverse",
  },
  {
    className:
      "top-1/2 right-[6%] h-24 w-24 -translate-y-1/2 rounded-full border-2 border-cyan-400/18",
    delay: "1800ms",
    animation:
      "shape-float 8.5s ease-in-out infinite, shape-pulse 3s ease-in-out infinite",
  },
  {
    className:
      "top-[6%] left-[12%] h-14 w-14 bg-gradient-to-br from-emerald-300/15 to-cyan-300/15",
    delay: "2000ms",
    animation:
      "shape-float 7.5s ease-in-out infinite, shape-rotate 18s linear infinite",
    style: {
      clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)",
    },
  },
];

export default function FloatingGeometricShapes({
  mounted = true,
}: FloatingGeometricShapesProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {SHAPES.map((shape, i) => (
        <div
          key={i}
          className={`absolute transition-all duration-1000 ${shape.className} ${
            mounted
              ? "translate-y-0 scale-100 opacity-100"
              : "opacity-0 scale-90"
          }`}
          style={{
            transitionDelay: shape.delay,
            animation: mounted ? shape.animation : undefined,
            ...shape.style,
          }}
        />
      ))}
    </div>
  );
}

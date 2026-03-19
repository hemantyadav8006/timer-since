"use client";

import { motion } from "framer-motion";

const WAVE_PATH = `
  M0 100
  L90 100
  L110 96
  L130 104
  L160 100
  L220 100
  L238 92
  L246 115
  L255 60
  L266 150
  L278 100
  L310 100
  L360 100
  L378 94
  L388 104
  L420 100
  L520 100

  L610 100
  L630 96
  L650 104
  L680 100
  L740 100
  L758 92
  L766 115
  L775 60
  L786 150
  L798 100
  L830 100
  L880 100
  L898 94
  L908 104
  L940 100
  L1200 100
`;

export default function ECGLine() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-40">
      {/* Subtle ECG monitor grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,255,136,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.10) 1px, transparent 1px)",
          backgroundSize: "46px 46px",
          maskImage:
            "radial-gradient(circle at 50% 40%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 45%, rgba(0,0,0,0) 75%)",
          WebkitMaskImage:
            "radial-gradient(circle at 50% 40%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 45%, rgba(0,0,0,0) 75%)",
        }}
      />

      {/* Monitor-style sweep: trace draws left -> right, then resets. */}
      <motion.div className="absolute inset-y-0 left-0 w-full">
        <svg
          viewBox="0 0 1200 200"
          className="h-full w-full"
          preserveAspectRatio="none"
        >
          <defs>
            <filter id="ecgGlow" x="-20%" y="-50%" width="140%" height="200%">
              <feGaussianBlur stdDeviation="4.2" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="
                  0 0 0 0 0
                  0 0 0 0 1
                  0 0 0 0 0.62
                  0 0 0 1 0"
                result="greenGlow"
              />
              <feMerge>
                <feMergeNode in="greenGlow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Sweep mask: sharp head + fading tail (like an actual monitor). */}
            <linearGradient id="sweepGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="65%" stopColor="rgba(255,255,255,0.00)" />
              <stop offset="86%" stopColor="rgba(255,255,255,0.30)" />
              <stop offset="94%" stopColor="rgba(255,255,255,0.95)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>

            <mask id="sweepMask">
              <rect x="0" y="0" width="1200" height="200" fill="black" />
              <motion.rect
                y="0"
                width="520"
                height="200"
                fill="url(#sweepGradient)"
                initial={{ x: -520 }}
                animate={{ x: [-520, 1200] }}
                transition={{ duration: 4.8, repeat: Infinity, ease: "linear" }}
              />
            </mask>
          </defs>

          <motion.g
            // Subtle baseline drift so it feels “alive”
            animate={{ y: [0, -1.2, 0.6, 0] }}
            transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Baseline */}
            <path
              d="M0 100 L1200 100"
              stroke="rgba(0,255,136,0.16)"
              strokeWidth="2.4"
              fill="none"
            />

            {/* Move the whole signal leftward continuously so spikes aren’t fixed in one place. */}
            <motion.g
              animate={{ x: [0, -1200] }}
              transition={{ duration: 7.5, repeat: Infinity, ease: "linear" }}
            >
              {/* Faint “history” trace */}
              <g>
                <path
                  d={WAVE_PATH}
                  stroke="rgba(0,255,136,0.20)"
                  strokeWidth="2.4"
                  fill="none"
                />
                <path
                  d={WAVE_PATH}
                  transform="translate(1200 0)"
                  stroke="rgba(0,255,136,0.20)"
                  strokeWidth="2.4"
                  fill="none"
                />
              </g>

              {/* The “live” sweep (masked) */}
              <motion.g mask="url(#sweepMask)">
                <motion.path
                  d={WAVE_PATH}
                  stroke="#00ff88"
                  strokeWidth="3.2"
                  fill="none"
                  filter="url(#ecgGlow)"
                  initial={{ opacity: 0.9 }}
                  animate={{ opacity: [0.85, 1, 0.88] }}
                  transition={{
                    duration: 2.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <motion.path
                  d={WAVE_PATH}
                  transform="translate(1200 0)"
                  stroke="#00ff88"
                  strokeWidth="3.2"
                  fill="none"
                  filter="url(#ecgGlow)"
                  initial={{ opacity: 0.9 }}
                  animate={{ opacity: [0.85, 1, 0.88] }}
                  transition={{
                    duration: 2.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.g>
            </motion.g>

            {/* Pulse head (bright dot) moving left -> right */}
            <motion.circle
              r="4.2"
              cy="100"
              fill="#00ff88"
              filter="url(#ecgGlow)"
              initial={{ cx: -10, opacity: 0 }}
              animate={{
                cx: [-10, 1200],
                opacity: [0, 1, 1, 0],
                r: [3.4, 5.0, 3.6],
              }}
              transition={{
                duration: 4.8,
                repeat: Infinity,
                ease: "linear",
                times: [0, 0.06, 0.94, 1],
              }}
            />
          </motion.g>
        </svg>
      </motion.div>
    </div>
  );
}

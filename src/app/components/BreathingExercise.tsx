"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/app/providers/ThemeProvider";
import ModalBackdrop from "@/components/ui/ModalBackdrop";

type Phase = "inhale" | "hold" | "exhale" | "rest";

const PATTERNS: Record<string, { label: string; phases: [Phase, number][] }> = {
  "4-4-4-4": {
    label: "Box Breathing (4-4-4-4)",
    phases: [
      ["inhale", 4],
      ["hold", 4],
      ["exhale", 4],
      ["rest", 4],
    ],
  },
  "4-7-8": {
    label: "Relaxing (4-7-8)",
    phases: [
      ["inhale", 4],
      ["hold", 7],
      ["exhale", 8],
    ],
  },
  "5-5": {
    label: "Simple (5-5)",
    phases: [
      ["inhale", 5],
      ["exhale", 5],
    ],
  },
};

const PHASE_LABELS: Record<Phase, string> = {
  inhale: "Inhale",
  hold: "Hold",
  exhale: "Exhale",
  rest: "Rest",
};

type Props = { open: boolean; onClose: () => void };

export default function BreathingExercise({ open, onClose }: Props) {
  const { theme } = useTheme();
  const [pattern, setPattern] = useState("4-4-4-4");
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [secsLeft, setSecsLeft] = useState(0);
  const [cycles, setCycles] = useState(0);

  const p = PATTERNS[pattern];
  const phase = p.phases[phaseIdx];
  const scale =
    phase[0] === "inhale" ? 1.5 : phase[0] === "exhale" ? 0.8 : 1.15;

  const start = useCallback(() => {
    setPhaseIdx(0);
    setSecsLeft(p.phases[0][1]);
    setCycles(0);
    setRunning(true);
  }, [p]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecsLeft((prev) => {
        if (prev <= 1) {
          setPhaseIdx((pi) => {
            const next = pi + 1;
            if (next >= p.phases.length) {
              setCycles((c) => c + 1);
              setSecsLeft(p.phases[0][1]);
              return 0;
            }
            setSecsLeft(p.phases[next][1]);
            return next;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, p]);

  return (
    <ModalBackdrop open={open} onClose={onClose} maxWidth="max-w-sm">
      <h2 className="mb-4 text-center text-lg font-bold text-white/90">
        Breathing Exercise
      </h2>

      {!running && (
        <div className="mb-6 flex flex-col gap-2">
          {Object.entries(PATTERNS).map(([k, v]) => (
            <button
              key={k}
              type="button"
              onClick={() => setPattern(k)}
              className={`rounded-xl border px-4 py-2 text-sm transition ${pattern === k ? "border-white/25 bg-white/8 text-white" : "border-white/8 text-white/45 hover:text-white"}`}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}

      <div className="relative mx-auto mb-6 flex h-48 w-48 items-center justify-center">
        <motion.div
          animate={{ scale: running ? scale : 1 }}
          transition={{ duration: phase[1], ease: "easeInOut" }}
          className="absolute h-40 w-40 rounded-full"
          style={{
            backgroundColor: `${theme.primary}18`,
            border: `2px solid ${theme.primary}35`,
            boxShadow: `0 0 60px ${theme.primary}15`,
          }}
        />
        <div className="relative z-10 text-center">
          {running ? (
            <>
              <div
                className="text-2xl font-bold"
                style={{ color: theme.primary }}
              >
                {secsLeft}
              </div>
              <div className="text-sm text-white/55">
                {PHASE_LABELS[phase[0]]}
              </div>
            </>
          ) : (
            <div className="text-sm text-white/45">Ready</div>
          )}
        </div>
      </div>

      {running && (
        <div className="mb-4 text-center text-xs text-white/35">
          Cycles: {cycles}
        </div>
      )}

      <div className="flex gap-3">
        {!running ? (
          <button
            type="button"
            onClick={start}
            className="flex-1 rounded-xl py-3 text-sm font-semibold text-black"
            style={{ backgroundColor: theme.primary }}
          >
            Start
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setRunning(false)}
            className="flex-1 rounded-xl border border-red-500/25 bg-red-500/10 py-3 text-sm font-semibold text-red-300"
          >
            Stop
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white/50 hover:text-white"
        >
          Close
        </button>
      </div>
    </ModalBackdrop>
  );
}

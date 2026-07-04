"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { formatElapsed, pad2 } from "@/lib/utils";
import type { ElapsedTime } from "@/types/timer";

type TimerDisplayProps = {
  startTime: number;
  now: number;
  formattedStart: string;
  onReset: () => void;
  isResetting: boolean;
  stopped: boolean;
  onStop: () => void;
  onResync: () => void;
  error: string | null;
  onDismissError: () => void;
};

export default function TimerDisplay({
  startTime,
  now,
  formattedStart,
  onReset,
  isResetting,
  stopped,
  onStop,
  onResync,
  error,
  onDismissError,
}: TimerDisplayProps) {
  const elapsed: ElapsedTime = useMemo(
    () => formatElapsed(now - startTime),
    [now, startTime],
  );

  return (
    <div className="space-y-6">
      {/* Header: start time + reset */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-white/65">
          Start: <span className="text-white/90">{formattedStart}</span>
        </div>

        {/* <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={onReset}
          disabled={isResetting}
          className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-black/40 px-4 py-2 text-sm font-semibold text-white/85 transition hover:border-white/25 hover:text-white disabled:opacity-50"
        >
          {isResetting ? "Resetting…" : "Reset"}
        </motion.button> */}
      </div>

      {/* Elapsed counter */}
      <motion.div
        className="relative rounded-2xl border border-emerald-400/15 bg-black/40 px-6 py-10 text-center shadow-[0_0_60px_rgba(0,255,136,0.10)]"
        animate={{
          boxShadow: [
            "0 0 45px rgba(0,255,136,0.08)",
            "0 0 70px rgba(0,255,136,0.16)",
            "0 0 45px rgba(0,255,136,0.08)",
          ],
        }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_50%_40%,rgba(0,255,136,0.12),transparent_55%)]" />

        <motion.div
          className="relative font-mono text-3xl font-semibold tracking-tight text-white"
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: [0.98, 1, 0.995], opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          key={`${elapsed.years}-${elapsed.months}-${elapsed.days}-${elapsed.hours}-${elapsed.minutes}-${elapsed.seconds}`}
        >
          {elapsed.years > 0 && (
            <>
              <span className="text-emerald-300">{elapsed.years}</span>
              <span className="text-white/60 text-[0.6em]">years</span>{" "}
            </>
          )}
          {(elapsed.years > 0 || elapsed.months > 0) && (
            <>
              <span className="text-emerald-300">{elapsed.months}</span>
              <span className="text-white/60 text-[0.6em]">months</span>{" "}
            </>
          )}
          <span className="text-emerald-300">{elapsed.days}</span>
          <span className="text-white/60 text-[0.6em]">days</span>{" "}
          <span>{pad2(elapsed.hours)}</span>
          <span className="text-white/60">:</span>
          <span>{pad2(elapsed.minutes)}</span>
          <span className="text-white/60">:</span>
          <span>{pad2(elapsed.seconds)}</span>
        </motion.div>

        <div className="relative mt-4 text-xs uppercase tracking-[0.3em] text-white/55">
          Elapsed time
        </div>
      </motion.div>

      {/* Stop / Resync controls */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {!stopped ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onStop}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-red-500/25 bg-red-500/10 px-5 py-3 font-semibold text-red-300 transition hover:border-red-500/40 hover:text-red-200"
          >
            Stop Timer
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onResync}
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-black shadow-[0_0_24px_rgba(0,255,136,0.25)] transition hover:shadow-[0_0_34px_rgba(0,255,136,0.35)]"
          >
            Resync
          </motion.button>
        )}
      </div>

      {/* Stopped indicator */}
      {stopped && (
        <div className="text-center text-sm text-amber-300/80">
          Timer paused — press Resync to resume
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <span>{error}</span>
          <button
            type="button"
            onClick={onDismissError}
            aria-label="Dismiss error"
            className="ml-3 text-red-300 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

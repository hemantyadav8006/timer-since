"use client";

import { motion } from "framer-motion";
import { toDatetimeLocalValue } from "@/lib/utils";

type TimerSetupProps = {
  inputValue: string;
  onInputChange: (value: string) => void;
  onStart: () => void;
  onReset: () => void;
  isStarting: boolean;
  isResetting: boolean;
  isLoading: boolean;
  error: string | null;
  onDismissError: () => void;
};

export default function TimerSetup({
  inputValue,
  onInputChange,
  onStart,
  onReset,
  isStarting,
  isResetting,
  isLoading,
  error,
  onDismissError,
}: TimerSetupProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="timer-datetime" className="block text-sm text-white/70">
          Pick a past date &amp; time
        </label>
        <input
          id="timer-datetime"
          type="datetime-local"
          value={inputValue}
          max={toDatetimeLocalValue(Date.now())}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onStart();
          }}
          className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-white outline-none ring-0 transition focus:border-emerald-400/50 focus:shadow-[0_0_0_4px_rgba(0,255,136,0.12)]"
        />
        <div className="text-xs text-white/45">
          This value is saved as epoch milliseconds in MongoDB.
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={onStart}
          disabled={isStarting}
          className="inline-flex flex-1 items-center justify-center rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-black shadow-[0_0_24px_rgba(0,255,136,0.25)] transition hover:shadow-[0_0_34px_rgba(0,255,136,0.35)] disabled:opacity-50"
        >
          {isStarting ? "Starting…" : "Start Timer"}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={onReset}
          disabled={isResetting}
          className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/15 bg-black/40 px-5 py-3 font-semibold text-white/85 transition hover:border-white/25 hover:text-white disabled:opacity-50"
        >
          {isResetting ? "Resetting…" : "Reset"}
        </motion.button>
      </div>

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

      {/* Status text */}
      {!error &&
        (isLoading ? (
          <div className="text-sm text-white/50">Loading saved timer…</div>
        ) : (
          <div className="text-sm text-white/50">
            No timer saved yet. Start one above.
          </div>
        ))}
    </div>
  );
}

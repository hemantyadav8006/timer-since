"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { isValidDatetimeLocal } from "@/lib/utils";
import { fetchTimer, startTimer, resetTimer } from "@/lib/api/timer";
import AudioPlayer from "./AudioPlayer";
import EntriesPanel from "./EntriesPanel";
import TimerDisplay from "./TimerDisplay";
import TimerSetup from "./TimerSetup";

export default function TimeSinceTimer() {
  // ── Timer state ─────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  // ── In-flight action guards ─────────────────────────────
  const [isStarting, setIsStarting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // ── Load persisted timer on mount ───────────────────────

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const saved = await fetchTimer();
        if (!cancelled) setStartTime(saved);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to fetch timer.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Tick every second while running ─────────────────────

  useEffect(() => {
    if (startTime == null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [startTime]);

  // ── Auto-dismiss errors after 5 seconds ─────────────────

  useEffect(() => {
    if (!error) return;
    const id = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(id);
  }, [error]);

  // ── Derived values ──────────────────────────────────────

  const formattedStart = useMemo(() => {
    if (startTime == null) return "";
    return new Date(startTime).toLocaleString();
  }, [startTime]);

  // ── Handlers ────────────────────────────────────────────

  const handleStart = useCallback(async () => {
    setError(null);

    if (!inputValue || !isValidDatetimeLocal(inputValue)) {
      setError("Please pick a valid date and time.");
      return;
    }

    const ms = Date.parse(inputValue);
    if (ms > Date.now()) {
      setError("Start time cannot be in the future.");
      return;
    }

    try {
      setIsStarting(true);
      const saved = await startTimer(ms);
      setStartTime(saved);
      setNow(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start timer.");
    } finally {
      setIsStarting(false);
    }
  }, [inputValue]);

  const handleReset = useCallback(async () => {
    setError(null);

    try {
      setIsResetting(true);
      await resetTimer();
      setStartTime(null);
      setInputValue("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reset timer.");
    } finally {
      setIsResetting(false);
    }
  }, []);

  const dismissError = useCallback(() => setError(null), []);

  // ── Render ──────────────────────────────────────────────

  return (
    <motion.div
      className="relative z-10 w-full max-w-2xl px-5 sm:px-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Floating entries panel */}
      {/* <EntriesPanel /> */}

      {/* Title row + audio */}
      <div className="flex items-center justify-between gap-4">
        <AudioPlayer onError={setError} />
      </div>

      {/* Main card */}
      <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md sm:p-8">
        {startTime == null ? (
          <TimerSetup
            inputValue={inputValue}
            onInputChange={setInputValue}
            onStart={handleStart}
            onReset={handleReset}
            isStarting={isStarting}
            isResetting={isResetting}
            isLoading={loading}
            error={error}
            onDismissError={dismissError}
          />
        ) : (
          <TimerDisplay
            startTime={startTime}
            now={now}
            formattedStart={formattedStart}
            onReset={handleReset}
            isResetting={isResetting}
            error={error}
            onDismissError={dismissError}
          />
        )}
      </div>
    </motion.div>
  );
}

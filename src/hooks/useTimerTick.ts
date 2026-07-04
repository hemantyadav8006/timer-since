"use client";

import { useEffect, useState } from "react";

/**
 * Shared hook that returns the current timestamp, ticking every `intervalMs`.
 * Pauses when `paused` is true. Eliminates duplicate setInterval logic across components.
 */
export function useTimerTick(paused = false, intervalMs = 1000): number {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (paused) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [paused, intervalMs]);

  return now;
}

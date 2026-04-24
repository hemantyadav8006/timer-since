/* ──────────────────────────────────────────────────────────
 *  Timer API service — all network calls with proper error
 *  handling so components never see unhandled rejections.
 * ────────────────────────────────────────────────────────── */

import type { TimerApiResponse } from "@/types/timer";

/** Fetch the persisted start-time (or null if none exists). */
export async function fetchTimer(): Promise<number | null> {
  const res = await fetch("/api/timer", { cache: "no-store" });
  const data = (await res.json()) as TimerApiResponse;

  if (!res.ok || "error" in data) {
    throw new Error("error" in data ? data.error : "Failed to fetch timer.");
  }

  return data.startTime;
}

/** Persist a new start-time (epoch ms). Returns the saved value. */
export async function startTimer(startTime: number): Promise<number | null> {
  const res = await fetch("/api/timer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ startTime }),
  });

  const data = (await res.json()) as TimerApiResponse;

  if (!res.ok || "error" in data) {
    throw new Error("error" in data ? data.error : "Failed to start timer.");
  }

  return data.startTime;
}

/** Delete all timer documents (reset). */
export async function resetTimer(): Promise<void> {
  const res = await fetch("/api/timer", { method: "DELETE" });

  if (!res.ok) {
    throw new Error("Failed to reset timer.");
  }
}

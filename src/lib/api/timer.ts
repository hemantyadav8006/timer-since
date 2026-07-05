/* ──────────────────────────────────────────────────────────
 *  Timer API service — all network calls with proper error
 *  handling so components never see unhandled rejections.
 * ────────────────────────────────────────────────────────── */

import type { TimerApiResponse, TimerState } from "@/types/timer";

function parseTimerResponse(data: TimerApiResponse): TimerState {
  if ("error" in data) {
    throw new Error(data.error);
  }

  return {
    startTime: data.startTime,
    stopTimeAt: data.stopTimeAt ?? null,
    resumedTimeAt: data.resumedTimeAt ?? null,
  };
}

/** Fetch the persisted timer state (or null startTime if none exists). */
export async function fetchTimer(): Promise<TimerState> {
  const res = await fetch("/api/timer", { cache: "no-store" });
  const data = (await res.json()) as TimerApiResponse;

  if (!res.ok) {
    throw new Error("error" in data ? data.error : "Failed to fetch timer.");
  }

  return parseTimerResponse(data);
}

/** Persist a new start-time (epoch ms). Returns the saved timer state. */
export async function startTimer(startTime: number): Promise<TimerState> {
  const res = await fetch("/api/timer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ startTime }),
  });

  const data = (await res.json()) as TimerApiResponse;

  if (!res.ok) {
    throw new Error("error" in data ? data.error : "Failed to start timer.");
  }

  return parseTimerResponse(data);
}

/** Partially update timer fields (stop/resume timestamps). */
export async function patchTimer(
  updates: Partial<Pick<TimerState, "stopTimeAt" | "resumedTimeAt">>,
): Promise<TimerState> {
  const res = await fetch("/api/timer", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });

  const data = (await res.json()) as TimerApiResponse;

  if (!res.ok) {
    throw new Error("error" in data ? data.error : "Failed to update timer.");
  }

  return parseTimerResponse(data);
}

/** Delete all timer documents (reset). */
export async function resetTimer(): Promise<void> {
  const res = await fetch("/api/timer", { method: "DELETE" });

  if (!res.ok) {
    throw new Error("Failed to reset timer.");
  }
}

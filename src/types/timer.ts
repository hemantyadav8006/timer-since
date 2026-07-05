/* ──────────────────────────────────────────────────────────
 *  Shared types used across timer components & API layer
 * ────────────────────────────────────────────────────────── */

// ── Entry ───────────────────────────────────────────────

export type EntryItem = {
  _id: string;
  when: number; // epoch ms
  text: string;
  createdAt?: string;
  updatedAt?: string;
};

// ── Timer state ─────────────────────────────────────────

export type TimerState = {
  startTime: number | null;
  stopTimeAt: number | null;
  resumedTimeAt: number | null;
};

export function isTimerStopped(
  stopTimeAt: number | null,
  resumedTimeAt: number | null,
): boolean {
  if (stopTimeAt == null) return false;
  if (resumedTimeAt == null) return true;
  return stopTimeAt > resumedTimeAt;
}

// ── API response discriminated unions ───────────────────

export type TimerApiResponse = TimerState | { error: string };

export type EntriesApiResponse =
  | { entries: EntryItem[] }
  | { error: string };

export type EntryApiResponse =
  | { entry: EntryItem }
  | { error: string };

export type DeleteApiResponse =
  | { ok: true }
  | { error: string };

// ── Elapsed time breakdown ──────────────────────────────

export type ElapsedTime = {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

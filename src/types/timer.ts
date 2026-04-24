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

// ── API response discriminated unions ───────────────────

export type TimerApiResponse =
  | { startTime: number | null }
  | { error: string };

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

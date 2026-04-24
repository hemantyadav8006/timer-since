/* ──────────────────────────────────────────────────────────
 *  Pure utility / formatting helpers (no React dependency)
 * ────────────────────────────────────────────────────────── */

import type { ElapsedTime } from "@/types/timer";

/** Zero-pad a number to 2 digits. */
export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Format seconds into `m:ss` for audio playback display. */
export function formatPlayback(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${pad2(secs)}`;
}

/**
 * Convert milliseconds into a year/month/day/hour/minute/second breakdown.
 * Uses calendar-aware date arithmetic for accurate year & month values.
 */
export function formatElapsed(ms: number): ElapsedTime {
  const zero: ElapsedTime = { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  if (ms <= 0) return zero;

  const start = new Date(Date.now() - ms);
  const end = new Date();

  // ── Step 1: sub-day difference (hours, minutes, seconds) ──
  let hours = end.getHours() - start.getHours();
  let minutes = end.getMinutes() - start.getMinutes();
  let seconds = end.getSeconds() - start.getSeconds();

  // Borrow upward: seconds → minutes → hours → days
  if (seconds < 0) {
    seconds += 60;
    minutes--;
  }
  if (minutes < 0) {
    minutes += 60;
    hours--;
  }

  let dayBorrow = 0;
  if (hours < 0) {
    hours += 24;
    dayBorrow = 1;
  }

  // ── Step 2: calendar difference (years, months, days) ─────
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate() - dayBorrow;

  if (days < 0) {
    months--;
    // Number of days in the month before `end`
    const daysInPrevMonth = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    days += daysInPrevMonth;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  return { years, months, days, hours, minutes, seconds };
}

/** Check whether a `datetime-local` string can be parsed. */
export function isValidDatetimeLocal(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

/**
 * Convert an epoch-ms timestamp into the value format used by
 * `<input type="datetime-local">` → `"YYYY-MM-DDTHH:mm"`.
 */
export function toDatetimeLocalValue(epochMs: number): string {
  const d = new Date(epochMs);
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

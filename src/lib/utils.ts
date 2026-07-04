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
  const zero: ElapsedTime = {
    years: 0,
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  };
  if (ms <= 0) return zero;

  const start = new Date(Date.now() - ms);
  const end = new Date();

  let hours = end.getHours() - start.getHours();
  let minutes = end.getMinutes() - start.getMinutes();
  let seconds = end.getSeconds() - start.getSeconds();

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

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate() - dayBorrow;

  if (days < 0) {
    months--;
    const daysInPrevMonth = new Date(
      end.getFullYear(),
      end.getMonth(),
      0,
    ).getDate();
    days += daysInPrevMonth;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  return { years, months, days, hours, minutes, seconds };
}

/**
 * Format remaining time for countdown timers.
 * Identical to formatElapsed but takes a target timestamp.
 */
export function formatCountdown(targetTime: number): ElapsedTime {
  const remaining = targetTime - Date.now();
  if (remaining <= 0) {
    return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  return formatElapsed(remaining);
}

/** Check whether a `datetime-local` string can be parsed. */
export function isValidDatetimeLocal(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

/**
 * Convert an epoch-ms timestamp into the value format used by
 * `<input type="datetime-local">` -> `"YYYY-MM-DDTHH:mm"`.
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

/** Generate a unique share ID. */
export function generateShareId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

/** Format a duration in ms to a human-readable string. */
export function formatDuration(ms: number): string {
  if (ms < 0) return "0s";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);

  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

/** Convert timer data to CSV format. */
export function timersToCSV(
  timers: {
    title: string;
    mode: string;
    startDate: number;
    category: string;
    tags?: string[];
    favorite?: boolean;
    pinned?: boolean;
    archived?: boolean;
    createdAt?: string;
  }[],
): string {
  const headers = ["Title", "Mode", "Start Date", "Category", "Tags", "Favorite", "Pinned", "Archived", "Created At"];
  const rows = timers.map((t) => [
    `"${t.title.replace(/"/g, '""')}"`,
    t.mode,
    new Date(t.startDate).toISOString(),
    t.category,
    `"${(t.tags ?? []).join(", ")}"`,
    String(t.favorite ?? false),
    String(t.pinned ?? false),
    String(t.archived ?? false),
    t.createdAt ?? "",
  ]);
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

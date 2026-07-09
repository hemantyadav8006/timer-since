/* ──────────────────────────────────────────────────────────
 *  Shared types — single source of truth for the entire app
 * ────────────────────────────────────────────────────────── */

// ── Enums ───────────────────────────────────────────────

export type TimerMode = "elapsed" | "countdown";

export type TimerCategory =
  | "health"
  | "productivity"
  | "relationship"
  | "education"
  | "lifestyle"
  | "personal"
  | "work"
  | "custom";

export const CATEGORIES: { value: TimerCategory; label: string; icon: string }[] = [
  { value: "health", label: "Health", icon: "❤️" },
  { value: "productivity", label: "Productivity", icon: "⚡" },
  { value: "relationship", label: "Relationship", icon: "💕" },
  { value: "education", label: "Education", icon: "📚" },
  { value: "lifestyle", label: "Lifestyle", icon: "🌿" },
  { value: "personal", label: "Personal", icon: "👤" },
  { value: "work", label: "Work", icon: "💼" },
  { value: "custom", label: "Custom", icon: "⚙️" },
];

export type ThemeName =
  | "emerald"
  | "rose"
  | "ocean"
  | "purple"
  | "amber"
  | "monochrome";

export type SoundName =
  | "heartbeat"
  | "rain"
  | "bowls"
  | "nature"
  | "chime"
  | "none";

export type ViewMode = "grid" | "list" | "compact" | "focus";

export type SortOption =
  | "newest"
  | "oldest"
  | "alphabetical"
  | "longest-running"
  | "shortest-remaining"
  | "recently-updated"
  | "favorites-first"
  | "pinned-first";

// ── Sub-types ───────────────────────────────────────────

export type StreakRecord = {
  startTime: number;
  endTime: number;
  duration: number;
};

export type MilestoneDefinition = {
  label: string;
  durationMs: number;
  icon: string;
};

export type MilestoneConfig = {
  enabled: boolean;
  customMilestones: MilestoneDefinition[];
};

// ── Timer ───────────────────────────────────────────────

export type TimerItem = {
  _id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: TimerCategory;
  tags: string[];
  mode: TimerMode;
  startDate: number;
  targetDate: number | null;
  archived: boolean;
  favorite: boolean;
  pinned: boolean;
  shareId: string;
  isPublic: boolean;
  userId: string;
  stopped: boolean;
  stoppedAt: number | null;
  streaks: StreakRecord[];
  milestoneConfig: MilestoneConfig;
  sound: SoundName;
  createdAt?: string;
  updatedAt?: string;
};

/** Fields allowed when creating a timer. */
export type CreateTimerPayload = {
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  category?: TimerCategory;
  tags?: string[];
  mode?: TimerMode;
  startDate: number;
  targetDate?: number | null;
  sound?: SoundName;
  milestoneConfig?: MilestoneConfig;
};

/** Fields allowed when updating a timer. */
export type UpdateTimerPayload = Partial<
  Pick<
    TimerItem,
    | "title"
    | "description"
    | "icon"
    | "color"
    | "category"
    | "tags"
    | "mode"
    | "startDate"
    | "targetDate"
    | "archived"
    | "favorite"
    | "pinned"
    | "stopped"
    | "stoppedAt"
    | "isPublic"
    | "sound"
    | "milestoneConfig"
    | "streaks"
  >
>;

// ── Entry (Journal) ─────────────────────────────────────

export type EntryItem = {
  _id: string;
  timerId: string;
  when: number;
  text: string;
  createdAt?: string;
  updatedAt?: string;
};

// ── User ────────────────────────────────────────────────

export type UserPreferences = {
  theme: ThemeName;
  language: string;
  reducedMotion: boolean;
};

export type UserItem = {
  _id: string;
  email: string;
  name: string;
  preferences: UserPreferences;
};

// ── Elapsed time breakdown ──────────────────────────────

export type ElapsedTime = {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

// ── API response shapes ─────────────────────────────────

export type TimerApiResponse = { timer: TimerItem } | { error: string };
export type TimersApiResponse = { timers: TimerItem[] } | { error: string };
export type EntriesApiResponse = { entries: EntryItem[] } | { error: string };
export type EntryApiResponse = { entry: EntryItem } | { error: string };
export type DeleteApiResponse = { ok: true } | { error: string };
export type UserApiResponse = { user: UserItem } | { error: string };
export type AuthCheckResponse = { user: UserItem } | { error: string };
export type RegisterApiResponse =
  | { needsVerification: true; email: string }
  | { user: UserItem }
  | { error: string };
export type LoginApiResponse =
  | { user: UserItem }
  | { error: string; code?: string; email?: string };
export type VerifyEmailApiResponse = { user: UserItem } | { error: string; attemptsLeft?: number };
export type MessageApiResponse = { ok: true; message: string } | { error: string };
export type ResetPasswordApiResponse =
  | { ok: true; message: string }
  | { error: string; attemptsLeft?: number };

// ── Theme colors ────────────────────────────────────────

export type ThemeColors = {
  primary: string;
  primaryRgb: string;
  accent: string;
  glow: string;
  glowHover: string;
  border: string;
  bg: string;
  text: string;
};

// ── Utility: compute elapsed ms from a timer ────────────

/** Wall-clock time used for display when a timer may be paused. */
export function getEffectiveNow(timer: TimerItem, now: number): number {
  if (timer.stopped && timer.stoppedAt != null) return timer.stoppedAt;
  return now;
}

export function computeElapsedMs(timer: TimerItem, now: number): number {
  const effectiveNow = getEffectiveNow(timer, now);
  if (timer.mode === "countdown") {
    const target = timer.targetDate ?? timer.startDate;
    return Math.max(0, target - effectiveNow);
  }
  return Math.max(0, effectiveNow - timer.startDate);
}

export function isCountdownComplete(timer: TimerItem, now = Date.now()): boolean {
  if (timer.mode !== "countdown") return false;
  const effectiveNow = getEffectiveNow(timer, now);
  const target = timer.targetDate ?? timer.startDate;
  return target <= effectiveNow;
}

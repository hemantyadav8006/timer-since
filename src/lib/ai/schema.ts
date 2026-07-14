import { z } from "zod";
import type { CreateTimerPayload, MilestoneConfig } from "@/types/timer";
import {
  PARSE_TIMER_MAX_PROMPT_CHARS,
  PARSE_TIMER_MIN_PROMPT_CHARS,
} from "@/lib/ai/constants";

export { PARSE_TIMER_MAX_PROMPT_CHARS, PARSE_TIMER_MIN_PROMPT_CHARS };

export const TIMER_CATEGORIES = [
  "health",
  "productivity",
  "relationship",
  "education",
  "lifestyle",
  "personal",
  "work",
  "custom",
] as const;

export const TIMER_SOUNDS = [
  "heartbeat",
  "rain",
  "bowls",
  "nature",
  "chime",
  "none",
] as const;

export const TIMER_MODES = ["elapsed", "countdown"] as const;

export const milestoneDraftSchema = z.object({
  label: z.string().min(1).max(80),
  durationMs: z.number().positive().finite(),
  icon: z.string().min(1).max(8).default("🏆"),
});

/**
 * Structured LLM output for natural-language timer creation.
 * Dates are epoch milliseconds relative to the provided "now".
 */
export const timerDraftSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(500).default(""),
  icon: z.string().min(1).max(8).default("⏱️"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default("#00FF88"),
  category: z.enum(TIMER_CATEGORIES),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
  mode: z.enum(TIMER_MODES),
  /** Epoch ms — start for elapsed; creation/now for countdown. */
  startDate: z.number().finite(),
  /** Epoch ms target for countdown; null for elapsed. */
  targetDate: z.number().finite().nullable().default(null),
  sound: z.enum(TIMER_SOUNDS).default("none"),
  milestones: z.array(milestoneDraftSchema).max(12).default([]),
  /** Human-readable assumptions the model made (shown in UI). */
  assumptions: z.array(z.string().max(200)).max(8).default([]),
  confidence: z.enum(["high", "medium", "low"]).default("medium"),
});

export type TimerDraft = z.infer<typeof timerDraftSchema>;

export function draftToCreatePayload(draft: TimerDraft): CreateTimerPayload {
  const milestoneConfig: MilestoneConfig = {
    enabled: true,
    customMilestones: draft.milestones.map((m) => ({
      label: m.label,
      durationMs: m.durationMs,
      icon: m.icon || "🏆",
    })),
  };

  return {
    title: draft.title.trim(),
    description: (draft.description ?? "").trim().slice(0, 500),
    icon: draft.icon.slice(0, 8),
    color: draft.color,
    category: draft.category,
    tags: draft.tags
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 20),
    mode: draft.mode,
    startDate:
      draft.mode === "elapsed"
        ? draft.startDate
        : (draft.startDate ?? Date.now()),
    targetDate: draft.mode === "countdown" ? draft.targetDate : null,
    sound: draft.sound,
    milestoneConfig,
  };
}

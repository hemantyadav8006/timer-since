import type { MilestoneDefinition, TimerItem } from "@/types/timer";

export type MilestoneStatus = {
  milestone: MilestoneDefinition;
  achieved: boolean;
  progress: number;
};

const DEFAULT_MILESTONES: MilestoneDefinition[] = [
  { label: "1 Hour", durationMs: 3_600_000, icon: "⏰" },
  { label: "24 Hours", durationMs: 86_400_000, icon: "⭐" },
  { label: "7 Days", durationMs: 604_800_000, icon: "🌟" },
  { label: "30 Days", durationMs: 2_592_000_000, icon: "🏅" },
  { label: "100 Days", durationMs: 8_640_000_000, icon: "💯" },
  { label: "365 Days", durationMs: 31_536_000_000, icon: "🏆" },
  { label: "2 Years", durationMs: 63_072_000_000, icon: "💎" },
  { label: "3 Years", durationMs: 94_608_000_000, icon: "👑" },
  { label: "5 Years", durationMs: 157_680_000_000, icon: "🌹" },
  { label: "6 Years", durationMs: 189_216_000_000, icon: "🎖️" },
  { label: "7 Years", durationMs: 220_752_000_000, icon: "🏵️" },
  { label: "8 Years", durationMs: 252_288_000_000, icon: "🥇" },
  { label: "9 Years", durationMs: 283_824_000_000, icon: "🎗️" },
  { label: "10 Years", durationMs: 315_360_000_000, icon: "🎆" },
];

export function getMilestonesForTimer(timer: TimerItem): MilestoneDefinition[] {
  if (
    timer.milestoneConfig.enabled &&
    timer.milestoneConfig.customMilestones.length > 0
  ) {
    return timer.milestoneConfig.customMilestones;
  }
  return DEFAULT_MILESTONES;
}

export function evaluateMilestones(
  milestones: MilestoneDefinition[],
  elapsedMs: number,
): MilestoneStatus[] {
  return [...milestones]
    .sort((a, b) => a.durationMs - b.durationMs)
    .map((m) => ({
      milestone: m,
      achieved: elapsedMs >= m.durationMs,
      progress: Math.min(1, elapsedMs / m.durationMs),
    }));
}

export function getNextMilestone(
  milestones: MilestoneDefinition[],
  elapsedMs: number,
): MilestoneDefinition | null {
  const sorted = [...milestones].sort((a, b) => a.durationMs - b.durationMs);
  return sorted.find((m) => elapsedMs < m.durationMs) ?? null;
}

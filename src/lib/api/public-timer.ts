import type { TimerCategory, TimerMode, MilestoneConfig } from "@/types/timer";

/** Fields safe to expose on the public share endpoint. */
export type PublicTimerDto = {
  shareId: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: TimerCategory;
  mode: TimerMode;
  startDate: number;
  targetDate: number | null;
  stopped: boolean;
  stoppedAt: number | null;
  milestoneConfig: MilestoneConfig;
};

export function toPublicTimerDto(timer: {
  shareId: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: TimerCategory;
  mode: TimerMode;
  startDate: number;
  targetDate: number | null;
  stopped: boolean;
  stoppedAt: number | null;
  milestoneConfig: MilestoneConfig;
}): PublicTimerDto {
  return {
    shareId: timer.shareId,
    title: timer.title,
    description: timer.description,
    icon: timer.icon,
    color: timer.color,
    category: timer.category,
    mode: timer.mode,
    startDate: timer.startDate,
    targetDate: timer.targetDate,
    stopped: timer.stopped,
    stoppedAt: timer.stoppedAt,
    milestoneConfig: timer.milestoneConfig,
  };
}

"use client";

import { useMemo } from "react";
import { getMilestonesForTimer, evaluateMilestones } from "@/lib/milestones";
import { formatDuration } from "@/lib/utils";
import type { TimerItem } from "@/types/timer";

type MilestoneBadgesProps = {
  timer: TimerItem;
  elapsedMs: number;
};

export default function MilestoneBadges({
  timer,
  elapsedMs,
}: MilestoneBadgesProps) {
  const milestones = useMemo(() => getMilestonesForTimer(timer), [timer]);

  const statuses = useMemo(
    () => evaluateMilestones(milestones, elapsedMs),
    [milestones, elapsedMs],
  );

  if (statuses.length === 0) return null;

  const achieved = statuses.filter((s) => s.achieved);
  const nextUp = statuses.find((s) => !s.achieved);

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-white/45">
        Milestones
      </h3>

      {achieved.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {achieved.map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium"
              style={{
                borderColor: `${timer.color}35`,
                backgroundColor: `${timer.color}12`,
                color: timer.color,
              }}
            >
              <span>{s.milestone.icon}</span>
              <span>{s.milestone.label}</span>
            </div>
          ))}
        </div>
      )}

      {nextUp && (
        <div className="rounded-xl border border-white/8 bg-white/3 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/50">
              Next: {nextUp.milestone.icon} {nextUp.milestone.label}
            </span>
            <span style={{ color: timer.color }}>
              {Math.round(nextUp.progress * 100)}%
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${nextUp.progress * 100}%`,
                backgroundColor: timer.color,
              }}
            />
          </div>
          <div className="mt-1 text-[10px] text-white/35">
            {formatDuration(nextUp.milestone.durationMs - elapsedMs)} remaining
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef } from "react";
import { getMilestonesForTimer, evaluateMilestones } from "@/lib/milestones";
import { formatDuration } from "@/lib/utils";
import { notifyMilestoneAchieved } from "@/lib/notifications";
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

  const prevAchievedCount = useRef(0);

  useEffect(() => {
    const achieved = statuses.filter((s) => s.achieved);
    if (achieved.length > prevAchievedCount.current) {
      const newest = achieved[achieved.length - 1];
      notifyMilestoneAchieved(
        timer.title,
        newest.milestone.label,
        newest.milestone.icon,
      );
    }
    prevAchievedCount.current = achieved.length;
  }, [statuses, timer.title]);

  if (statuses.length === 0) return null;

  const achieved = statuses.filter((s) => s.achieved);
  const nextUp = statuses.find((s) => !s.achieved);

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-app-muted">
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
        <div className="rounded-xl border border-app-border bg-app-surface p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-app-muted">
              Next: {nextUp.milestone.icon} {nextUp.milestone.label}
            </span>
            <span style={{ color: timer.color }}>
              {Math.round(nextUp.progress * 100)}%
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-app-surface-strong">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${nextUp.progress * 100}%`,
                backgroundColor: timer.color,
              }}
            />
          </div>
          <div className="mt-1 text-[10px] text-app-muted">
            {formatDuration(nextUp.milestone.durationMs - elapsedMs)} remaining
          </div>
        </div>
      )}
    </div>
  );
}

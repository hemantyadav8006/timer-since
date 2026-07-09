"use client";

import { useMemo } from "react";
import { formatDuration } from "@/lib/utils";
import type { StreakRecord } from "@/types/timer";

type StreakHeatmapProps = {
  streaks: StreakRecord[];
  currentStreakMs: number;
  color: string;
};

export default function StreakHeatmap({
  streaks,
  currentStreakMs,
  color,
}: StreakHeatmapProps) {
  const bestStreak = useMemo(() => {
    const all = [...streaks.map((s) => s.duration), currentStreakMs];
    return Math.max(0, ...all);
  }, [streaks, currentStreakMs]);

  const heatmapData = useMemo(() => {
    const days: { date: string; active: boolean }[] = [];
    const now = new Date();
    for (let i = 83; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayStart = new Date(dateStr).getTime();
      const dayEnd = dayStart + 86_400_000;
      const active = streaks.some(
        (s) => s.startTime < dayEnd && s.endTime > dayStart,
      ) || (currentStreakMs > 0 && i < currentStreakMs / 86_400_000);
      days.push({ date: dateStr, active });
    }
    return days;
  }, [streaks, currentStreakMs]);

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-app-muted">
        Streaks
      </h3>
      <div className="flex gap-4 text-xs">
        <div>
          <div className="text-app-muted">Current</div>
          <div className="font-semibold" style={{ color }}>{formatDuration(currentStreakMs)}</div>
        </div>
        <div>
          <div className="text-app-muted">Best</div>
          <div className="font-semibold" style={{ color }}>{formatDuration(bestStreak)}</div>
        </div>
        <div>
          <div className="text-app-muted">Total Resets</div>
          <div className="font-semibold text-app-fg">{streaks.length}</div>
        </div>
      </div>
      <div className="rounded-xl border border-app-border bg-app-surface p-3">
        <div className="mb-1 text-[10px] text-app-muted">Last 12 weeks</div>
        <div className="grid grid-cols-[repeat(12,1fr)] gap-[3px]">
          {heatmapData.map((day, i) => (
            <div
              key={i}
              title={`${day.date}: ${day.active ? "Active" : "Inactive"}`}
              className="aspect-square rounded-[2px]"
              style={{ backgroundColor: day.active ? `${color}70` : "var(--app-chart-empty)" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

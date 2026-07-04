"use client";

import { memo, useMemo } from "react";
import { formatElapsed, formatCountdown, pad2 } from "@/lib/utils";
import { computeElapsedMs, isCountdownComplete } from "@/types/timer";
import type { TimerItem, ElapsedTime } from "@/types/timer";
import { useTimerTick } from "@/hooks/useTimerTick";

type TimerCardProps = {
  timer: TimerItem;
  onClick: () => void;
  variant?: "grid" | "list" | "compact";
};

function formatTimeString(e: ElapsedTime): string {
  const parts: string[] = [];
  if (e.years > 0) parts.push(`${e.years}y`);
  if (e.months > 0) parts.push(`${e.months}mo`);
  if (e.days > 0 || parts.length > 0) parts.push(`${e.days}d`);
  parts.push(`${pad2(e.hours)}:${pad2(e.minutes)}:${pad2(e.seconds)}`);
  return parts.join(" ");
}

export default memo(function TimerCard({
  timer,
  onClick,
  variant = "grid",
}: TimerCardProps) {
  const now = useTimerTick(timer.stopped);

  const elapsed: ElapsedTime = useMemo(() => {
    if (timer.mode === "countdown") {
      const target = timer.targetDate ?? timer.startDate;
      return formatCountdown(target);
    }
    return formatElapsed(now - timer.startDate);
  }, [now, timer.startDate, timer.targetDate, timer.mode]);

  const done = isCountdownComplete(timer);
  const timeStr = formatTimeString(elapsed);

  // ── Compact variant ───────────────────────────────────
  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 px-3 py-2 text-left transition hover:bg-white/6"
      >
        <span className="text-base">{timer.icon}</span>
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-white/80">
          {timer.title}
        </span>
        <span
          className="shrink-0 font-mono text-xs font-semibold"
          style={{ color: timer.color }}
        >
          {done ? "Done!" : timeStr}
        </span>
        {timer.pinned && <span className="text-[10px]">📌</span>}
        {timer.favorite && <span className="text-[10px]">⭐</span>}
      </button>
    );
  }

  // ── List variant ──────────────────────────────────────
  if (variant === "list") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-4 rounded-xl border border-white/8 bg-white/3 px-4 py-3 text-left transition hover:bg-white/6"
      >
        <span className="text-2xl">{timer.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-white/90">
              {timer.title}
            </span>
            {timer.pinned && <span className="text-xs">📌</span>}
            {timer.favorite && <span className="text-xs">⭐</span>}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-white/40">
            <span>{timer.mode === "countdown" ? "Countdown" : "Elapsed"}</span>
            <span>&middot;</span>
            <span className="capitalize">{timer.category}</span>
            {timer.tags.length > 0 && (
              <>
                <span>&middot;</span>
                <span className="truncate">{timer.tags.join(", ")}</span>
              </>
            )}
          </div>
        </div>
        <div
          className="shrink-0 font-mono text-sm font-semibold"
          style={{ color: timer.color }}
        >
          {done ? "Done!" : timeStr}
        </div>
        {timer.stopped && (
          <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] text-amber-300">
            Paused
          </span>
        )}
      </button>
    );
  }

  // ── Grid variant (default) ────────────────────────────
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col gap-3 rounded-2xl border border-white/8 bg-white/3 p-5 text-left transition hover:bg-white/6"
      style={{ borderColor: `${timer.color}15` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{timer.icon}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-semibold text-white/90">
                {timer.title}
              </span>
              {timer.pinned && <span className="text-[10px]">📌</span>}
              {timer.favorite && <span className="text-[10px]">⭐</span>}
            </div>
            <div className="text-[11px] capitalize text-white/40">
              {timer.category}
            </div>
          </div>
        </div>
        {timer.stopped && (
          <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] text-amber-300">
            Paused
          </span>
        )}
      </div>

      {timer.description && (
        <p className="line-clamp-2 text-xs text-white/35">{timer.description}</p>
      )}

      <div
        className="rounded-xl px-4 py-3 text-center font-mono text-lg font-semibold"
        style={{
          backgroundColor: `${timer.color}08`,
          border: `1px solid ${timer.color}15`,
          color: timer.color,
        }}
      >
        {done ? "Countdown complete!" : timeStr}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.2em] text-white/35">
          {timer.mode === "countdown" ? "Remaining" : "Elapsed"}
        </span>
        {timer.tags.length > 0 && (
          <div className="flex gap-1">
            {timer.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] text-white/40"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
});

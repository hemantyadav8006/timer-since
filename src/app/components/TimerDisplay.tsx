"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { formatElapsed, formatCountdown, pad2 } from "@/lib/utils";
import { getEffectiveNow, isCountdownComplete } from "@/types/timer";
import type { ElapsedTime, TimerItem } from "@/types/timer";
import { notifyCountdownComplete } from "@/lib/notifications";
import Confetti from "@/components/ui/Confetti";

type TimerDisplayProps = {
  timer: TimerItem;
  now: number;
  onStop: () => void;
  onResync: () => void;
  onDelete: () => void;
  onShare: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onToggleFavorite: () => void;
  onTogglePin: () => void;
  onArchive: () => void;
};

export default memo(function TimerDisplay({
  timer,
  now,
  onStop,
  onResync,
  onDelete,
  onShare,
  onEdit,
  onDuplicate,
  onToggleFavorite,
  onTogglePin,
  onArchive,
}: TimerDisplayProps) {
  const isCountdown = timer.mode === "countdown";
  const effectiveNow = getEffectiveNow(timer, now);
  const done = isCountdownComplete(timer, now);
  const prevDone = useRef(done);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    if (done && !prevDone.current) {
      setCelebrate(true);
      notifyCountdownComplete(timer.title, timer.icon);
      setTimeout(() => setCelebrate(false), 4000);
    }
    prevDone.current = done;
  }, [done, timer.title, timer.icon]);

  const elapsed: ElapsedTime = useMemo(() => {
    if (isCountdown) {
      const target = timer.targetDate ?? timer.startDate;
      return formatCountdown(target, effectiveNow);
    }
    return formatElapsed(effectiveNow - timer.startDate);
  }, [effectiveNow, timer.startDate, timer.targetDate, isCountdown]);

  const formattedDate = useMemo(
    () => new Date(isCountdown ? (timer.targetDate ?? timer.startDate) : timer.startDate).toLocaleString(),
    [timer.startDate, timer.targetDate, isCountdown],
  );

  return (
    <div className="space-y-5">
      <Confetti active={celebrate} color={timer.color} />
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{timer.icon}</span>
            <h2 className="truncate text-lg font-bold text-white/90">
              {timer.title}
            </h2>
          </div>
          {timer.description && (
            <p className="mt-1 text-sm text-white/45">{timer.description}</p>
          )}
          <div className="mt-1 text-xs text-white/40">
            {isCountdown ? "Target" : "Started"}: {formattedDate}
          </div>
          {timer.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {timer.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-white/50"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={onToggleFavorite} title={timer.favorite ? "Unfavorite" : "Favorite"} className="rounded-lg border border-white/8 px-2 py-1.5 text-xs hover:bg-white/5">
            {timer.favorite ? "⭐" : "☆"}
          </button>
          <button type="button" onClick={onTogglePin} title={timer.pinned ? "Unpin" : "Pin"} className="rounded-lg border border-white/8 px-2 py-1.5 text-xs hover:bg-white/5">
            {timer.pinned ? "📌" : "📍"}
          </button>
          <button type="button" onClick={onEdit} className="rounded-lg border border-white/8 px-2.5 py-1.5 text-xs text-white/50 hover:text-white">Edit</button>
          <button type="button" onClick={onDuplicate} className="rounded-lg border border-white/8 px-2.5 py-1.5 text-xs text-white/50 hover:text-white">Duplicate</button>
          <button type="button" onClick={onShare} className="rounded-lg border border-white/8 px-2.5 py-1.5 text-xs text-white/50 hover:text-white">Share</button>
          <button type="button" onClick={onArchive} className="rounded-lg border border-white/8 px-2.5 py-1.5 text-xs text-white/50 hover:text-white">Archive</button>
          <button type="button" onClick={onDelete} className="rounded-lg border border-red-500/15 px-2.5 py-1.5 text-xs text-red-300/60 hover:text-red-200">Delete</button>
        </div>
      </div>

      {/* Timer counter */}
      <div
        className="animate-glow-pulse relative rounded-2xl border bg-black/40 px-6 py-8 text-center sm:py-10"
        style={{
          borderColor: `${timer.color}15`,
          boxShadow: `0 0 50px ${timer.color}08`,
        }}
      >
        <div
          className="absolute inset-0 rounded-2xl"
          style={{ background: `radial-gradient(circle at 50% 40%, ${timer.color}10, transparent 55%)` }}
        />

        {done ? (
          <div className="relative text-2xl font-bold" style={{ color: timer.color }}>
            Countdown complete!
          </div>
        ) : (
          <div className="relative font-mono text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {elapsed.years > 0 && (
              <>
                <span style={{ color: timer.color }}>{elapsed.years}</span>
                <span className="text-white/50 text-[0.6em]">y </span>
              </>
            )}
            {(elapsed.years > 0 || elapsed.months > 0) && (
              <>
                <span style={{ color: timer.color }}>{elapsed.months}</span>
                <span className="text-white/50 text-[0.6em]">mo </span>
              </>
            )}
            <span style={{ color: timer.color }}>{elapsed.days}</span>
            <span className="text-white/50 text-[0.6em]">d </span>
            <span>{pad2(elapsed.hours)}</span>
            <span className="text-white/50">:</span>
            <span>{pad2(elapsed.minutes)}</span>
            <span className="text-white/50">:</span>
            <span>{pad2(elapsed.seconds)}</span>
          </div>
        )}

        <div className="relative mt-3 text-xs uppercase tracking-[0.3em] text-white/45">
          {isCountdown ? "Remaining" : "Elapsed time"}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2 sm:flex-row">
        {!timer.stopped ? (
          <button
            type="button"
            onClick={onStop}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-red-500/25 bg-red-500/10 px-5 py-3 font-semibold text-red-300 transition hover:border-red-500/40 active:scale-[0.98]"
          >
            Stop Timer
          </button>
        ) : (
          <button
            type="button"
            onClick={onResync}
            className="inline-flex flex-1 items-center justify-center rounded-xl px-5 py-3 font-semibold text-black transition active:scale-[0.98]"
            style={{
              backgroundColor: timer.color,
              boxShadow: `0 0 24px ${timer.color}40`,
            }}
          >
            Resync
          </button>
        )}
      </div>

      {timer.stopped && (
        <div className="text-center text-sm text-amber-300/80">
          Timer paused — press Resync to resume
        </div>
      )}
    </div>
  );
});

"use client";

import { memo, useMemo } from "react";
import { formatElapsed, formatCountdown, pad2, formatDate } from "@/lib/utils";
import { getEffectiveNow } from "@/types/timer";
import type { ElapsedTime, TimerItem } from "@/types/timer";
import { useCountdownCelebration } from "@/hooks/useCountdownCelebration";
import CountdownCompleteCelebration from "@/components/ui/CountdownCompleteCelebration";
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
  const { done, celebrating } = useCountdownCelebration(timer, now, {
    enabled: true,
  });

  const elapsed: ElapsedTime = useMemo(() => {
    if (isCountdown) {
      const target = timer.targetDate ?? timer.startDate;
      return formatCountdown(target, effectiveNow);
    }
    return formatElapsed(effectiveNow - timer.startDate);
  }, [effectiveNow, timer.startDate, timer.targetDate, isCountdown]);

  const formattedDate = useMemo(
    () =>
      formatDate(
        new Date(
          isCountdown ? (timer.targetDate ?? timer.startDate) : timer.startDate,
        ).toISOString(),
      ),
    [timer.startDate, timer.targetDate, isCountdown],
  );

  return (
    <div className="space-y-5">
      <Confetti active={celebrating} color={timer.color} />
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{timer.icon}</span>
            <h2 className="truncate text-lg font-bold text-app-fg">
              {timer.title}
            </h2>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={onToggleFavorite}
            title={timer.favorite ? "Unfavorite" : "Favorite"}
            className="rounded-lg border border-app-border px-2 py-1.5 text-xs hover:bg-app-surface-strong"
          >
            {timer.favorite ? "⭐" : "☆"}
          </button>
          <button
            type="button"
            onClick={onTogglePin}
            title={timer.pinned ? "Unpin" : "Pin"}
            className="rounded-lg border border-app-border px-2 py-1.5 text-xs hover:bg-app-surface-strong"
          >
            {timer.pinned ? "📌" : "📍"}
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg border border-app-border px-2.5 py-1.5 text-xs text-app-muted hover:text-app-fg"
          >
            Edit
          </button>
          {!timer.stopped && (
            <button
              type="button"
              onClick={onDuplicate}
              className="rounded-lg border border-app-border px-2.5 py-1.5 text-xs text-app-muted hover:text-app-fg"
            >
              Duplicate
            </button>
          )}
          <button
            type="button"
            onClick={onShare}
            className="rounded-lg border border-app-border px-2.5 py-1.5 text-xs text-app-muted hover:text-app-fg"
          >
            Share
          </button>
          <button
            type="button"
            onClick={onArchive}
            className="rounded-lg border border-app-border px-2.5 py-1.5 text-xs text-app-muted hover:text-app-fg"
          >
            {timer.archived ? "Unarchive" : "Archive"}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg border border-red-500/15 px-2.5 py-1.5 text-xs text-app-danger hover:text-app-danger-hover"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="text-sm text-app-muted">
        <div className="mt-1 text-xs text-app-muted">
          {isCountdown ? "Target" : "Started"}: {formattedDate}
        </div>
        {timer.description && (
          <p className="mt-1 text-sm text-app-muted">{timer.description}</p>
        )}
        {timer.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {timer.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-app-surface-strong px-2 py-0.5 text-[11px] text-app-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Timer counter */}
      <div
        className={`relative rounded-2xl border bg-app-surface px-6 py-8 text-center sm:py-10 ${
          celebrating ? "animate-glow-pulse" : ""
        }`}
        style={{
          borderColor: done ? `${timer.color}35` : `${timer.color}15`,
          boxShadow: done
            ? `0 0 50px ${timer.color}15`
            : `0 0 50px ${timer.color}08`,
        }}
      >
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: `radial-gradient(circle at 50% 40%, ${timer.color}10, transparent 55%)`,
          }}
        />

        {done ? (
          <div className="relative py-2">
            <CountdownCompleteCelebration
              timer={timer}
              celebrating={celebrating}
              variant="focus"
            />
          </div>
        ) : (
          <div className="relative font-mono text-2xl font-semibold tracking-tight text-app-fg sm:text-3xl">
            {elapsed.years > 0 && (
              <>
                <span style={{ color: timer.color }}>{elapsed.years}</span>
                <span className="text-app-muted text-[0.6em]">y </span>
              </>
            )}
            {(elapsed.years > 0 || elapsed.months > 0) && (
              <>
                <span style={{ color: timer.color }}>{elapsed.months}</span>
                <span className="text-app-muted text-[0.6em]">mo </span>
              </>
            )}
            <span style={{ color: timer.color }}>{elapsed.days}</span>
            <span className="text-app-muted text-[0.6em]">d </span>
            <span className="text-app-fg">{pad2(elapsed.hours)}</span>
            <span className="text-app-muted">:</span>
            <span className="text-app-fg">{pad2(elapsed.minutes)}</span>
            <span className="text-app-muted">:</span>
            <span className="text-app-fg">{pad2(elapsed.seconds)}</span>
          </div>
        )}

        <div className="relative mt-3 text-xs uppercase tracking-[0.3em] text-app-muted">
          {done ? "Completed" : isCountdown ? "Remaining" : "Elapsed time"}
        </div>
      </div>

      {/* Controls */}
      {done ? null : (
        <div className="flex flex-col gap-2 sm:flex-row">
          {!timer.stopped ? (
            <button
              type="button"
              onClick={onStop}
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-red-500/25 bg-red-500/10 px-5 py-3 font-semibold text-app-danger transition hover:border-red-500/40 active:scale-[0.98]"
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
      )}

      {timer.stopped && !done && (
        <div className="text-center text-sm text-app-warning">
          Timer paused — press Resync to resume
        </div>
      )}
    </div>
  );
});

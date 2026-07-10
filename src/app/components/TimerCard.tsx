"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { formatElapsed, formatCountdown, pad2 } from "@/lib/utils";
import { getEffectiveNow } from "@/types/timer";
import type { TimerItem, ElapsedTime } from "@/types/timer";
import { useTimerTick } from "@/hooks/useTimerTick";
import { useCountdownCelebration } from "@/hooks/useCountdownCelebration";
import CountdownCompleteCelebration from "@/components/ui/CountdownCompleteCelebration";

type TimerCardProps = {
  timer: TimerItem;
  onClick: () => void;
  variant?: "grid" | "list" | "compact";
  onCountdownComplete?: (timer: TimerItem) => void;
};

function formatTimeString(e: ElapsedTime): string {
  const parts: string[] = [];
  if (e.years > 0) parts.push(`${e.years}y`);
  if (e.months > 0) parts.push(`${e.months}mo`);
  if (e.days > 0 || parts.length > 0) parts.push(`${e.days}d`);
  parts.push(`${pad2(e.hours)}:${pad2(e.minutes)}:${pad2(e.seconds)}`);
  return parts.join(" ");
}

const cardMotion = {
  whileHover: { y: -3, scale: 1.01 },
  whileTap: { scale: 0.98 },
  transition: { type: "spring" as const, stiffness: 400, damping: 28 },
};

export default memo(function TimerCard({
  timer,
  onClick,
  variant = "grid",
  onCountdownComplete,
}: TimerCardProps) {
  const now = useTimerTick(timer.stopped);
  const effectiveNow = getEffectiveNow(timer, now);
  const { done, celebrating } = useCountdownCelebration(timer, now, {
    enabled: true,
    onCelebrate: onCountdownComplete,
  });

  const elapsed: ElapsedTime = useMemo(() => {
    if (timer.mode === "countdown") {
      const target = timer.targetDate ?? timer.startDate;
      return formatCountdown(target, effectiveNow);
    }
    return formatElapsed(effectiveNow - timer.startDate);
  }, [effectiveNow, timer.startDate, timer.targetDate, timer.mode]);

  const timeStr = formatTimeString(elapsed);
  const showComplete = timer.mode === "countdown" && done;

  if (variant === "compact") {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        {...cardMotion}
        className={`flex w-full items-center gap-3 rounded-xl border bg-app-surface/90 px-3 py-2 text-left backdrop-blur-sm transition-colors hover:border-app-fg/15 hover:bg-app-surface-strong ${
          showComplete ? "border-app-border" : "border-app-border"
        }`}
        style={
          showComplete
            ? {
                borderColor: `${timer.color}35`,
                boxShadow: `0 0 20px ${timer.color}12`,
              }
            : undefined
        }
      >
        <span className="text-base">{timer.icon}</span>
        {showComplete ? (
          <div className="min-w-0 flex-1">
            <CountdownCompleteCelebration
              timer={timer}
              celebrating={celebrating}
              variant="compact"
            />
          </div>
        ) : (
          <span className="min-w-0 flex-1 truncate text-xs font-medium text-app-fg">
            {timer.title}
          </span>
        )}
        {!showComplete && (
          <span
            className="shrink-0 font-mono text-xs font-semibold"
            style={{ color: timer.color }}
          >
            {timeStr}
          </span>
        )}
        {timer.pinned && <span className="text-[10px]">📌</span>}
        {timer.favorite && <span className="text-[10px]">⭐</span>}
      </motion.button>
    );
  }

  if (variant === "list") {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        {...cardMotion}
        className="flex w-full items-center gap-4 rounded-xl border border-app-border bg-app-surface/90 px-4 py-3 text-left backdrop-blur-sm transition-colors hover:border-app-fg/15 hover:bg-app-surface-strong"
        style={
          showComplete
            ? {
                borderColor: `${timer.color}30`,
                boxShadow: `0 0 24px ${timer.color}10`,
              }
            : undefined
        }
      >
        <span className="text-2xl">{timer.icon}</span>
        {showComplete ? (
          <div className="min-w-0 flex-1">
            <CountdownCompleteCelebration
              timer={timer}
              celebrating={celebrating}
              variant="list"
            />
          </div>
        ) : (
          <>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-app-fg">
                  {timer.title}
                </span>
                {timer.pinned && <span className="text-xs">📌</span>}
                {timer.favorite && <span className="text-xs">⭐</span>}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-app-muted">
                <span>Countdown</span>
                <span>&middot;</span>
                <span className="capitalize">{timer.category}</span>
              </div>
            </div>
            <div
              className="shrink-0 font-mono text-sm font-semibold"
              style={{ color: timer.color }}
            >
              {timeStr}
            </div>
          </>
        )}
        {timer.stopped && !showComplete && (
          <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] text-app-warning">
            Paused
          </span>
        )}
      </motion.button>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      {...cardMotion}
      className="group flex w-full flex-col gap-3 rounded-2xl border bg-app-surface/90 p-5 text-left backdrop-blur-sm transition-colors hover:bg-app-surface-strong"
      style={{
        borderColor: showComplete ? `${timer.color}40` : `${timer.color}18`,
        boxShadow: showComplete
          ? `0 0 32px ${timer.color}18`
          : celebrating
            ? `0 0 40px ${timer.color}25`
            : `0 0 0 0 ${timer.color}00`,
      }}
      whileHover={
        showComplete
          ? cardMotion.whileHover
          : {
              ...cardMotion.whileHover,
              boxShadow: `0 8px 32px -8px ${timer.color}30`,
            }
      }
    >
      {!showComplete && (
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <motion.span
              className="text-xl"
              whileHover={{ scale: 1.15, rotate: [0, -8, 8, 0] }}
              transition={{ duration: 0.35 }}
            >
              {timer.icon}
            </motion.span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-semibold text-app-fg">
                  {timer.title}
                </span>
                {timer.pinned && <span className="text-[10px]">📌</span>}
                {timer.favorite && <span className="text-[10px]">⭐</span>}
              </div>
              <div className="text-[11px] capitalize text-app-muted">
                {timer.category}
              </div>
            </div>
          </div>
          {timer.stopped && (
            <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] text-app-warning">
              Paused
            </span>
          )}
        </div>
      )}

      {!showComplete && timer.description && (
        <p className="line-clamp-2 text-xs text-app-muted">
          {timer.description}
        </p>
      )}

      <div
        className={`rounded-xl px-4 py-3 text-center transition-shadow ${
          showComplete
            ? "py-5"
            : "font-mono text-lg font-semibold group-hover:shadow-inner"
        }`}
        style={{
          backgroundColor: `${timer.color}08`,
          border: `1px solid ${timer.color}${showComplete ? "30" : "15"}`,
          color: timer.color,
        }}
      >
        {showComplete ? (
          <CountdownCompleteCelebration
            timer={timer}
            celebrating={celebrating}
            variant="card"
          />
        ) : (
          timeStr
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.2em] text-app-muted">
          {showComplete
            ? "Completed"
            : timer.mode === "countdown"
              ? "Remaining"
              : "Elapsed"}
        </span>
        {!showComplete && timer.tags.length > 0 && (
          <div className="flex gap-1">
            {timer.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-app-surface-strong px-1.5 py-0.5 text-[9px] text-app-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.button>
  );
});

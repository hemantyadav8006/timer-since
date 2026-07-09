"use client";

import { motion } from "framer-motion";
import { useTheme } from "@/app/providers/ThemeProvider";
import type { TimerItem } from "@/types/timer";

type CountdownCompleteCelebrationProps = {
  timer: TimerItem;
  celebrating: boolean;
  variant: "card" | "focus" | "list" | "compact";
};

export default function CountdownCompleteCelebration({
  timer,
  celebrating,
  variant,
}: CountdownCompleteCelebrationProps) {
  const { reducedMotion } = useTheme();

  const iconSize =
    variant === "focus" ? "text-4xl" : variant === "card" ? "text-2xl" : "text-lg";
  const titleSize =
    variant === "focus"
      ? "text-xl sm:text-2xl"
      : variant === "card"
        ? "text-base font-bold"
        : "text-xs font-semibold";
  const badgeSize = variant === "focus" ? "text-sm" : "text-[10px]";

  const spring = reducedMotion
    ? { duration: 0.2 }
    : { type: "spring" as const, stiffness: 380, damping: 24 };

  return (
    <div className="relative flex flex-col items-center justify-center gap-1.5 text-center">
      {celebrating && !reducedMotion && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-xl"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${timer.color}22, transparent 70%)`,
          }}
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <motion.span
        className={`relative ${iconSize}`}
        initial={reducedMotion ? false : { scale: 0, rotate: -12 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={spring}
      >
        {timer.icon}
      </motion.span>

      <motion.p
        className={`relative max-w-full truncate px-1 ${titleSize}`}
        style={{ color: timer.color }}
        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: reducedMotion ? 0 : 0.08 }}
      >
        {timer.title}
      </motion.p>

      <motion.span
        className={`relative rounded-full px-2.5 py-0.5 font-semibold uppercase tracking-wider ${badgeSize}`}
        style={{
          color: timer.color,
          backgroundColor: `${timer.color}18`,
          border: `1px solid ${timer.color}30`,
        }}
        initial={reducedMotion ? false : { opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...spring, delay: reducedMotion ? 0 : 0.18 }}
      >
        Complete!
      </motion.span>
    </div>
  );
}

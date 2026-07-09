"use client";

import { useEffect, useState, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppBackground from "@/components/ui/AppBackground";
import TimerDisplay from "@/app/components/TimerDisplay";
import MilestoneBadges from "@/app/components/MilestoneBadges";
import { fetchSharedTimer } from "@/lib/api/timers";
import { computeElapsedMs } from "@/types/timer";
import type { TimerItem } from "@/types/timer";
import { useTimerTick } from "@/hooks/useTimerTick";

export default function SharedTimerPage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = use(params);
  const [timer, setTimer] = useState<TimerItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const now = useTimerTick(timer?.stopped ?? true);

  useEffect(() => {
    fetchSharedTimer(shareId)
      .then(setTimer)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Timer not found."),
      );
  }, [shareId]);

  const elapsedMs = timer ? computeElapsedMs(timer, now) : 0;
  const noop = () => {};

  return (
    <AppBackground centered className="px-4">
      <main className="relative z-10 w-full max-w-2xl py-8 md:py-12">
        <AnimatePresence mode="wait">
          {error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="auth-card-glow rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center backdrop-blur-md md:p-8"
            >
              <div className="text-base text-red-500 md:text-lg">{error}</div>
            </motion.div>
          ) : !timer ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4 py-16 text-center"
            >
              <div className="h-10 w-10 animate-shimmer rounded-full border border-app-border" />
              <p className="text-sm text-app-muted">Loading shared timer...</p>
            </motion.div>
          ) : (
            <motion.div
              key="timer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4 md:space-y-6"
            >
              <div className="auth-card-glow rounded-2xl border border-app-border bg-app-surface/90 p-4 backdrop-blur-xl md:p-6">
                <TimerDisplay
                  timer={timer}
                  now={now}
                  onStop={noop}
                  onResync={noop}
                  onDelete={noop}
                  onShare={noop}
                  onEdit={noop}
                  onDuplicate={noop}
                  onToggleFavorite={noop}
                  onTogglePin={noop}
                  onArchive={noop}
                />
              </div>

              {timer.mode === "elapsed" && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="auth-card-glow rounded-2xl border border-app-border bg-app-surface/90 p-4 backdrop-blur-xl"
                >
                  <MilestoneBadges timer={timer} elapsedMs={elapsedMs} />
                </motion.div>
              )}

              <p className="text-center text-xs text-app-muted">
                Shared timer &middot; Read only
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </AppBackground>
  );
}

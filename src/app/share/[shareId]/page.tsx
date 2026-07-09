"use client";

import { useEffect, useState, use } from "react";
import ECGLine from "@/app/components/ECGLine";
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
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-app-bg px-4 text-app-fg">
      <ECGLine />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 20%, var(--app-accent-glow), transparent 55%)",
        }}
      />

      <main className="relative z-10 w-full max-w-2xl py-8 md:py-12">
        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center md:p-8">
            <div className="text-base text-red-500 md:text-lg">{error}</div>
          </div>
        ) : !timer ? (
          <div className="text-center text-app-muted">Loading shared timer...</div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            <div className="rounded-2xl border border-app-border bg-app-surface p-4 backdrop-blur-md md:p-6">
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
              <div className="rounded-2xl border border-app-border bg-app-surface p-4 backdrop-blur-md">
                <MilestoneBadges timer={timer} elapsedMs={elapsedMs} />
              </div>
            )}

            <div className="text-center text-xs text-app-muted">
              Shared timer &middot; Read only
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

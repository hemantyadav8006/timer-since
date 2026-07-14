"use client";

import { useCallback, useEffect, useRef, useState, use } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import AppBackground from "@/components/ui/AppBackground";
import TimerDisplay from "@/app/components/TimerDisplay";
import MilestoneBadges from "@/app/components/MilestoneBadges";
import YouTubeAmbientPlayer from "@/app/components/YouTubeAmbientPlayer";
import { useAuth } from "@/app/providers/AuthProvider";
import { useTheme } from "@/app/providers/ThemeProvider";
import { fetchSharedTimer } from "@/lib/api/timers";
import { computeElapsedMs } from "@/types/timer";
import type { TimerItem } from "@/types/timer";
import { useTimerTick } from "@/hooks/useTimerTick";
import { isValidYouTubeVideoId } from "@/lib/youtube-shared";
import { DASHBOARD_PATH, LOGIN_PATH } from "@/lib/auth-routes";

/** How often the share page re-fetches so pause/resume stays in sync with the owner. */
const SHARE_SYNC_INTERVAL_MS = 3_000;

export default function SharedTimerPage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = use(params);
  const { user, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const [timer, setTimer] = useState<TimerItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const now = useTimerTick(timer?.stopped ?? true);
  const hasLoadedRef = useRef(false);
  const syncGenerationRef = useRef(0);

  const sharePath = `/share/${shareId}`;
  const loginHref = `${LOGIN_PATH}?from=${encodeURIComponent(sharePath)}`;

  const syncTimer = useCallback(
    async (opts?: { initial?: boolean }) => {
      const generation = ++syncGenerationRef.current;
      try {
        const next = await fetchSharedTimer(shareId);
        if (generation !== syncGenerationRef.current) return;
        setTimer(next);
        setError(null);
        hasLoadedRef.current = true;
      } catch (e) {
        if (generation !== syncGenerationRef.current) return;
        const message = e instanceof Error ? e.message : "Timer not found.";
        const status =
          e instanceof Error && "status" in e
            ? Number((e as Error & { status?: number }).status)
            : undefined;
        const gone =
          status === 404 || /not found|not public|unavailable/i.test(message);

        // Unpublish/delete should clear the public snapshot; keep last view on
        // transient network errors after the first successful load.
        if (gone && hasLoadedRef.current) {
          setTimer(null);
          setError(message);
          hasLoadedRef.current = false;
          return;
        }

        if (opts?.initial || !hasLoadedRef.current) {
          setError(message);
        }
      }
    },
    [shareId],
  );

  useEffect(() => {
    hasLoadedRef.current = false;
    syncGenerationRef.current += 1;
    void syncTimer({ initial: true });

    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void syncTimer();
    }, SHARE_SYNC_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") void syncTimer();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      syncGenerationRef.current += 1;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [syncTimer]);

  const elapsedMs = timer ? computeElapsedMs(timer, now) : 0;
  const noop = () => {};

  return (
    <AppBackground centered className="px-4">
      <main className="relative z-10 w-full max-w-2xl py-8 md:py-12">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6 flex items-center justify-between gap-3 md:mb-8"
        >
          <Link
            href={user ? DASHBOARD_PATH : loginHref}
            className="text-base font-bold tracking-wider md:text-lg"
            style={{ color: theme.primary }}
          >
            Time Since
          </Link>

          {!authLoading &&
            (user ? (
              <Link
                href={DASHBOARD_PATH}
                className="rounded-lg border border-app-border bg-app-surface/80 px-3 py-1.5 text-xs text-app-fg backdrop-blur-sm transition hover:bg-app-surface-strong md:text-sm"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href={loginHref}
                className="rounded-lg border border-app-border bg-app-surface/80 px-3 py-1.5 text-xs text-app-fg backdrop-blur-sm transition hover:bg-app-surface-strong md:text-sm"
              >
                Log In
              </Link>
            ))}
        </motion.header>

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
                  readOnly
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

              {isValidYouTubeVideoId(timer.youtubeVideoId) && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <YouTubeAmbientPlayer
                    videoId={timer.youtubeVideoId}
                    title={timer.youtubeTitle}
                    thumbnail={timer.youtubeThumbnail}
                    color={timer.color}
                  />
                </motion.div>
              )}

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

              <div className="space-y-1.5 text-center">
                <p className="text-xs text-app-muted">
                  Shared timer &middot; Read only
                </p>
                {!authLoading && !user && (
                  <p className="text-xs text-app-muted">
                    Want your own timers?{" "}
                    <Link
                      href={loginHref}
                      className="text-app-fg/80 underline-offset-2 transition hover:text-app-fg hover:underline"
                    >
                      Sign up free
                    </Link>
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </AppBackground>
  );
}

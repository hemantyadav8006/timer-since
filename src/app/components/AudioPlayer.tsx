"use client";

import { useEffect, useRef, useState } from "react";
import { formatPlayback } from "@/lib/utils";

type AudioPlayerProps = {
  /** Called when an unrecoverable playback error occurs. */
  onError?: (message: string) => void;
};

export default function AudioPlayer({ onError }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number>(0);
  const wasPlayingBeforeSeekRef = useRef(false);
  const pendingResumeAfterSeekRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPreview, setSeekPreview] = useState<number | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);

  // ── Audio element event wiring ──────────────────────────

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onDurationChange = () => {
      const next = Number.isFinite(el.duration) ? el.duration : 0;
      setDuration(next);
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => {
      setIsPlaying(false);
      setIsSeeking(false);
      setSeekPreview(null);
    };
    const onEnded = () => setIsPlaying(false);
    const onWaiting = () => setIsBuffering(true);
    const onCanPlay = () => setIsBuffering(false);

    const onSeeked = () => {
      if (!pendingResumeAfterSeekRef.current) return;
      pendingResumeAfterSeekRef.current = false;
      void el.play().catch(() => {
        /* user can press play again */
      });
    };

    el.addEventListener("loadedmetadata", onDurationChange);
    el.addEventListener("durationchange", onDurationChange);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    el.addEventListener("seeked", onSeeked);
    el.addEventListener("waiting", onWaiting);
    el.addEventListener("canplay", onCanPlay);

    // If metadata was already loaded before the effect ran (cached audio),
    // the events above will never fire. Eagerly sync the duration now.
    if (el.readyState >= 1 && Number.isFinite(el.duration) && el.duration > 0) {
      setDuration(el.duration);
    }

    return () => {
      el.removeEventListener("loadedmetadata", onDurationChange);
      el.removeEventListener("durationchange", onDurationChange);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("seeked", onSeeked);
      el.removeEventListener("waiting", onWaiting);
      el.removeEventListener("canplay", onCanPlay);
    };
    // Intentionally no deps — only runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Smooth rAF-driven time sync ─────────────────────────

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const update = () => {
      if (!isSeeking) setCurrentTime(el.currentTime);
      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isSeeking]);

  // ── Handlers ────────────────────────────────────────────

  async function togglePlayback() {
    const el = audioRef.current;
    if (!el) return;

    try {
      if (el.paused) {
        await el.play();
      } else {
        el.pause();
      }
    } catch {
      onError?.("Playback was blocked by browser. Click Play again.");
    }
  }

  // Compute a unified display value for the slider & gradient.
  const displayTime = seekPreview ?? currentTime;
  const fillPercent = duration > 0 ? (displayTime / duration) * 100 : 0;

  return (
    <>
      {/* Hidden audio element */}
      <audio ref={audioRef} src="/heartbeat.mp3" preload="metadata" />

      <div className="w-full">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs uppercase tracking-[0.25em] text-white/60">
            Persistent Time Since
          </div>
          {/* Play / Pause toggle */}
          <button
            type="button"
            onClick={togglePlayback}
            disabled={isBuffering}
            aria-label={isPlaying ? "Pause song" : "Play song"}
            className="group inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-black/40 px-3 py-2 text-xs text-white/80 backdrop-blur transition hover:border-emerald-400/60 hover:text-white disabled:opacity-50"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isBuffering
                  ? "animate-pulse bg-yellow-400"
                  : isPlaying
                    ? "bg-emerald-400 shadow-[0_0_12px_rgba(0,255,136,0.8)]"
                    : "bg-white/30"
              }`}
            />
            {isBuffering ? "Loading…" : isPlaying ? "Pause Song" : "Play Song"}
          </button>
        </div>

        {/* Track scrubber — only shown when duration is known */}
        {duration > 0 && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md sm:p-5">
            <div className="mb-2 text-sm text-white/70">Track Control</div>

            <input
              type="range"
              min={0}
              max={duration}
              step={0.1}
              value={displayTime}
              disabled={!duration}
              aria-label="Seek audio"
              onPointerDown={() => {
                const el = audioRef.current;
                if (!el) return;
                wasPlayingBeforeSeekRef.current = !el.paused;
                if (!el.paused) el.pause();
                setIsSeeking(true);
              }}
              onInput={(e) => {
                const next = Number(
                  (e.currentTarget as HTMLInputElement).value,
                );
                setSeekPreview(next);
              }}
              onChange={(e) => {
                const el = audioRef.current;
                const next = Number(
                  (e.currentTarget as HTMLInputElement).value,
                );

                setIsSeeking(false);
                setSeekPreview(null);

                if (el && duration > 0) {
                  pendingResumeAfterSeekRef.current =
                    wasPlayingBeforeSeekRef.current;
                  el.currentTime = next;
                }

                wasPlayingBeforeSeekRef.current = false;
              }}
              className="w-full cursor-pointer accent-emerald-400"
              style={{
                background: `linear-gradient(
                to right,
                #34d399 ${fillPercent}%,
                #444 ${fillPercent}%
              )`,
              }}
            />

            <div className="mt-1 flex justify-between text-xs text-white/55">
              <span>{formatPlayback(displayTime)}</span>
              <span>{formatPlayback(duration)}</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

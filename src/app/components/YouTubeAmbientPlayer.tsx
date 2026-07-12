"use client";

import { memo, useEffect, useId, useRef, useState } from "react";
import { isValidYouTubeVideoId } from "@/lib/youtube-shared";

type YouTubeAmbientPlayerProps = {
  videoId: string;
  title: string | null | undefined;
  thumbnail: string | null | undefined;
  color: string;
};

type YtPlayer = {
  destroy: () => void;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
};

type YtNamespace = {
  Player: new (
    element: HTMLElement | string,
    config: {
      videoId: string;
      width?: string | number;
      height?: string | number;
      playerVars?: Record<string, number | string>;
      events?: {
        onReady?: () => void;
        onStateChange?: (event: { data: number }) => void;
        onError?: () => void;
      };
    },
  ) => YtPlayer;
  PlayerState: {
    PLAYING: number;
    PAUSED: number;
    ENDED: number;
  };
};

declare global {
  interface Window {
    YT?: YtNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiLoadPromise: Promise<boolean> | null = null;

function loadYouTubeApi(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.YT?.Player) return Promise.resolve(true);
  if (apiLoadPromise) return apiLoadPromise;

  apiLoadPromise = new Promise((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      if (!ok) apiLoadPromise = null;
      resolve(ok);
    };

    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      finish(!!window.YT?.Player);
    };

    const existing = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]',
    );
    if (!existing) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.onerror = () => finish(false);
      document.head.appendChild(tag);
    } else {
      const poll = window.setInterval(() => {
        if (window.YT?.Player) {
          window.clearInterval(poll);
          finish(true);
        }
      }, 50);
      window.setTimeout(() => {
        window.clearInterval(poll);
        finish(!!window.YT?.Player);
      }, 10_000);
    }
  });

  return apiLoadPromise;
}

export default memo(function YouTubeAmbientPlayer({
  videoId,
  title,
  thumbnail,
  color,
}: YouTubeAmbientPlayerProps) {
  const reactId = useId().replace(/:/g, "");
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YtPlayer | null>(null);
  const generationRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isValidYouTubeVideoId(videoId)) {
      setError("Invalid YouTube video.");
      setReady(false);
      return;
    }

    const host = hostRef.current;
    if (!host) return;

    const generation = ++generationRef.current;
    let cancelled = false;

    setReady(false);
    setIsPlaying(false);
    setError(null);

    // YT.Player replaces its target node with an iframe; always give it a fresh child.
    host.replaceChildren();
    const target = document.createElement("div");
    target.id = `yt-ambient-${reactId}-${generation}`;
    host.appendChild(target);

    const isCurrent = () => !cancelled && generation === generationRef.current;

    void loadYouTubeApi().then((ok) => {
      if (!isCurrent()) return;
      if (!ok || !window.YT?.Player) {
        setError("YouTube player failed to load.");
        return;
      }
      if (!host.contains(target)) return;

      const player = new window.YT.Player(target, {
        videoId,
        width: "100%",
        height: "200",
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          ...(typeof window !== "undefined"
            ? { origin: window.location.origin }
            : {}),
        },
        events: {
          onReady: () => {
            if (!isCurrent()) return;
            setReady(true);
          },
          onStateChange: (event) => {
            if (!isCurrent() || !window.YT) return;
            const { PLAYING, ENDED } = window.YT.PlayerState;
            if (event.data === ENDED) {
              try {
                player.seekTo(0, true);
                player.playVideo();
              } catch {
                setIsPlaying(false);
              }
              return;
            }
            setIsPlaying(event.data === PLAYING);
          },
          onError: () => {
            if (!isCurrent()) return;
            setError("This video can’t be played here.");
            setReady(false);
          },
        },
      });

      playerRef.current = player;

      // Cleanup may have run between construct and assignment.
      if (!isCurrent()) {
        try {
          player.destroy();
        } catch {
          /* ignore */
        }
        if (playerRef.current === player) playerRef.current = null;
      }
    });

    return () => {
      cancelled = true;
      generationRef.current += 1;
      const current = playerRef.current;
      playerRef.current = null;
      try {
        current?.destroy();
      } catch {
        /* already gone */
      }
      host.replaceChildren();
    };
  }, [videoId, reactId]);

  function togglePlayback() {
    const player = playerRef.current;
    if (!player || !ready || error) return;
    try {
      if (isPlaying) player.pauseVideo();
      else player.playVideo();
    } catch {
      /* player not ready */
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-app-border bg-app-surface/90 p-4 backdrop-blur-xl">
      <div className="flex items-start gap-3">
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt=""
            className="h-12 w-16 shrink-0 rounded-lg object-cover"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-wider text-app-muted">
            YouTube ambient
          </div>
          <div className="truncate text-sm font-medium text-app-fg">
            {title ?? "Selected video"}
          </div>
        </div>
        <button
          type="button"
          onClick={togglePlayback}
          disabled={!ready || !!error}
          className="shrink-0 rounded-full border px-3 py-1.5 text-xs transition hover:bg-app-surface-strong disabled:opacity-50"
          style={{ borderColor: `${color}35`, color }}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
      </div>

      {error && <div className="text-xs text-app-danger">{error}</div>}

      <div
        ref={hostRef}
        className="aspect-video w-full overflow-hidden rounded-xl bg-black/40"
      />
    </div>
  );
});

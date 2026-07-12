"use client";

import { useEffect, useRef, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { searchYouTube, type YouTubeSearchResult } from "@/lib/api/youtube";
import { isSessionExpiredError } from "@/lib/api/http";
import { sanitizeYouTubeFields } from "@/lib/youtube-shared";

export type YouTubeTrackSelection = {
  youtubeVideoId: string | null;
  youtubeTitle: string | null;
  youtubeThumbnail: string | null;
};

type YouTubeTrackPickerProps = {
  value: YouTubeTrackSelection;
  onChange: (value: YouTubeTrackSelection) => void;
};

function isAbortError(err: unknown): boolean {
  return (
    (err instanceof DOMException && err.name === "AbortError") ||
    (err instanceof Error && err.name === "AbortError")
  );
}

export default function YouTubeTrackPicker({
  value,
  onChange,
}: YouTubeTrackPickerProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const [results, setResults] = useState<YouTubeSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const selectedRef = useRef(!!value.youtubeVideoId);

  useEffect(() => {
    selectedRef.current = !!value.youtubeVideoId;
    if (value.youtubeVideoId) {
      setQuery("");
      setResults([]);
      setError(null);
      setSearched(false);
      setLoading(false);
    }
  }, [value.youtubeVideoId]);

  useEffect(() => {
    if (selectedRef.current) return;

    const q = debouncedQuery.trim();
    if (q.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      setSearched(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    void searchYouTube(q, controller.signal)
      .then((items) => {
        if (controller.signal.aborted || selectedRef.current) return;
        setResults(items);
        setSearched(true);
      })
      .catch((err) => {
        if (
          controller.signal.aborted ||
          selectedRef.current ||
          isAbortError(err) ||
          isSessionExpiredError(err)
        ) {
          return;
        }
        setResults([]);
        setSearched(true);
        setError(err instanceof Error ? err.message : "Search failed.");
      })
      .finally(() => {
        if (!controller.signal.aborted && !selectedRef.current) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  function selectTrack(track: YouTubeSearchResult) {
    selectedRef.current = true;
    onChange(
      sanitizeYouTubeFields({
        youtubeVideoId: track.videoId,
        youtubeTitle: track.title,
        youtubeThumbnail: track.thumbnail || null,
      }),
    );
    setQuery("");
    setResults([]);
    setSearched(false);
    setError(null);
    setLoading(false);
  }

  function clearTrack() {
    selectedRef.current = false;
    onChange({
      youtubeVideoId: null,
      youtubeTitle: null,
      youtubeThumbnail: null,
    });
  }

  return (
    <div className="space-y-2">
      <label className="mb-1 block text-xs text-app-muted">
        YouTube ambient (optional)
      </label>

      {value.youtubeVideoId ? (
        <div className="flex items-center gap-3 rounded-xl border border-app-border bg-app-surface px-3 py-2">
          {value.youtubeThumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value.youtubeThumbnail}
              alt=""
              className="h-10 w-14 shrink-0 rounded object-cover"
            />
          ) : (
            <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded bg-app-surface-strong text-xs text-app-muted">
              YT
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm text-app-fg">
              {value.youtubeTitle ?? "Selected video"}
            </div>
            <div className="text-[11px] text-app-muted">
              Plays on focus via YouTube embed
            </div>
          </div>
          <button
            type="button"
            onClick={clearTrack}
            className="shrink-0 rounded-lg border border-app-border px-2 py-1 text-xs text-app-muted hover:text-app-fg"
          >
            Clear
          </button>
        </div>
      ) : (
        <>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search YouTube videos…"
            className="w-full rounded-xl border border-app-border bg-app-input px-4 py-2.5 text-sm text-app-fg outline-none focus:border-app-fg/25"
          />
          {loading && <div className="text-xs text-app-muted">Searching…</div>}
          {error && <div className="text-xs text-app-danger">{error}</div>}
          {!loading &&
            !error &&
            searched &&
            results.length === 0 &&
            debouncedQuery.trim().length >= 2 && (
              <div className="text-xs text-app-muted">
                No embeddable videos found.
              </div>
            )}
          {results.length > 0 && (
            <ul className="max-h-48 overflow-y-auto rounded-xl border border-app-border bg-app-surface">
              {results.map((track, index) => (
                <li key={`${track.videoId}-${index}`}>
                  <button
                    type="button"
                    onClick={() => selectTrack(track)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-app-surface-strong"
                  >
                    {track.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={track.thumbnail}
                        alt=""
                        className="h-9 w-12 shrink-0 rounded object-cover"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium text-app-fg">
                        {track.title}
                      </div>
                      <div className="truncate text-[11px] text-app-muted">
                        {track.channelTitle}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

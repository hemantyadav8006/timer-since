"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

type TimerApiResponse = { startTime: number | null } | { error: string };

type EntryItem = {
  _id: string;
  when: number;
  text: string;
  createdAt?: string;
  updatedAt?: string;
};

type EntriesApiResponse = { entries: EntryItem[] } | { error: string };
type EntryApiResponse = { entry: EntryItem } | { error: string };

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatPlayback(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function formatElapsed(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

function isValidDatetimeLocal(value: string) {
  // datetime-local is like "2026-03-19T12:34"
  const ms = Date.parse(value);
  return Number.isFinite(ms);
}

export default function TimeSinceTimer() {
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [entries, setEntries] = useState<EntryItem[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [newWhen, setNewWhen] = useState("");
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWhen, setEditWhen] = useState("");
  const [editText, setEditText] = useState("");
  const [entriesOpen, setEntriesOpen] = useState(true);
  const newWhenRef = useRef<HTMLInputElement | null>(null);
  const editWhenRef = useRef<HTMLInputElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPreview, setSeekPreview] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wasPlayingBeforeSeekRef = useRef(false);
  const pendingResumeAfterSeekRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/timer", { cache: "no-store" });
        const data = (await res.json()) as TimerApiResponse;
        if (!res.ok || "error" in data) {
          throw new Error(
            "error" in data ? data.error : "Failed to fetch timer.",
          );
        }
        if (!cancelled) setStartTime(data.startTime);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to fetch timer.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Start collapsed on small screens.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 640px)");
    const apply = () => setEntriesOpen(!mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadEntries() {
      try {
        setEntriesLoading(true);
        const res = await fetch("/api/entries", { cache: "no-store" });
        const data = (await res.json()) as EntriesApiResponse;
        if (!res.ok || "error" in data) {
          throw new Error(
            "error" in data ? data.error : "Failed to fetch entries.",
          );
        }
        if (!cancelled) setEntries(data.entries);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to fetch entries.");
      } finally {
        if (!cancelled) setEntriesLoading(false);
      }
    }
    void loadEntries();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (startTime == null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [startTime]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    // Ensure metadata loads even before first play.
    el.load();

    const onTime = () => {
      if (!isSeeking) setCurrentTime(el.currentTime);
    };
    const onLoaded = () => {
      const nextDuration = Number.isFinite(el.duration) ? el.duration : 0;
      setDuration(nextDuration);
    };
    const onDuration = () => {
      const nextDuration = Number.isFinite(el.duration) ? el.duration : 0;
      setDuration(nextDuration);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => {
      setIsPlaying(false);
      setIsSeeking(false);
      setSeekPreview(null);
    };
    const onEnded = () => setIsPlaying(false);
    const onSeeked = () => {
      if (!pendingResumeAfterSeekRef.current) return;
      pendingResumeAfterSeekRef.current = false;
      void el.play().catch(() => {
        // ignore; user can press play again
      });
    };

    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("durationchange", onDuration);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    el.addEventListener("seeked", onSeeked);

    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("durationchange", onDuration);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("seeked", onSeeked);
    };
  }, [isSeeking]);

  const elapsed = useMemo(() => {
    if (startTime == null) return null;
    return formatElapsed(now - startTime);
  }, [now, startTime]);

  const formattedStart = useMemo(() => {
    if (startTime == null) return null;
    return new Date(startTime).toLocaleString();
  }, [startTime]);

  async function onStart() {
    setError(null);
    if (!inputValue || !isValidDatetimeLocal(inputValue)) {
      setError("Please pick a valid date and time.");
      return;
    }

    const ms = Date.parse(inputValue);
    if (ms > Date.now()) {
      setError("Start time cannot be in the future.");
      return;
    }

    const res = await fetch("/api/timer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startTime: ms }),
    });

    const data = (await res.json()) as TimerApiResponse;
    if (!res.ok || "error" in data) {
      setError("error" in data ? data.error : "Failed to start timer.");
      return;
    }

    setStartTime(data.startTime);
    setNow(Date.now());
  }

  async function onReset() {
    setError(null);
    const res = await fetch("/api/timer", { method: "DELETE" });
    if (!res.ok) {
      setError("Failed to reset timer.");
      return;
    }
    setStartTime(null);
    setInputValue("");
  }

  async function toggleTrackPlayback() {
    setError(null);
    const el = audioRef.current;
    if (!el) return;

    try {
      if (el.paused) {
        await el.play();
      } else {
        el.pause();
      }
    } catch {
      setError("Playback was blocked by browser. Click Play again.");
    }
  }

  function onSeekTrack(nextSeconds: number) {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = nextSeconds;
    setCurrentTime(nextSeconds);
  }

  function toDatetimeLocalValue(epochMs: number) {
    const d = new Date(epochMs);
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  }

  async function onAddEntry() {
    setError(null);
    if (!newWhen) {
      setError("Please select a date & time for the entry.");
      return;
    }
    const when = Date.parse(newWhen);
    if (!Number.isFinite(when)) {
      setError("Invalid entry date/time.");
      return;
    }
    const text = newText.trim();
    if (!text) {
      setError("Entry text is required.");
      return;
    }

    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ when, text }),
    });
    const data = (await res.json()) as EntryApiResponse;
    if (!res.ok || "error" in data) {
      setError("error" in data ? data.error : "Failed to add entry.");
      return;
    }
    setEntries((prev) => [data.entry, ...prev].sort((a, b) => b.when - a.when));
    setNewWhen("");
    setNewText("");
  }

  function beginEdit(entry: EntryItem) {
    setEditingId(entry._id);
    setEditWhen(toDatetimeLocalValue(entry.when));
    setEditText(entry.text);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditWhen("");
    setEditText("");
  }

  async function onUpdateEntry(id: string) {
    setError(null);
    const when = Date.parse(editWhen);
    if (!Number.isFinite(when)) {
      setError("Invalid entry date/time.");
      return;
    }
    const text = editText.trim();
    if (!text) {
      setError("Entry text is required.");
      return;
    }

    const res = await fetch(`/api/entries/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ when, text }),
    });
    const data = (await res.json()) as EntryApiResponse;
    if (!res.ok || "error" in data) {
      setError("error" in data ? data.error : "Failed to update entry.");
      return;
    }
    setEntries((prev) =>
      prev
        .map((e) => (e._id === id ? data.entry : e))
        .sort((a, b) => b.when - a.when),
    );
    cancelEdit();
  }

  async function onDeleteEntry(id: string) {
    setError(null);
    const res = await fetch(`/api/entries/${id}`, { method: "DELETE" });
    const data = (await res.json()) as { ok?: true; error?: string };
    if (!res.ok) {
      setError(data.error ?? "Failed to delete entry.");
      return;
    }
    setEntries((prev) => prev.filter((e) => e._id !== id));
    if (editingId === id) cancelEdit();
  }

  function openDatetimePicker(ref: React.RefObject<HTMLInputElement | null>) {
    const el = ref.current;
    if (!el) return;
    // showPicker is supported in Chromium-based browsers.
    try {
      (el as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
    } catch {
      // ignore
    }
    el.focus();
  }

  return (
    <motion.div
      className="relative z-10 w-full max-w-2xl px-5 sm:px-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Music track (place at /public/heartbeat.mp3) */}
      <audio ref={audioRef} src="/heartbeat.mp3" preload="metadata" />

      {/* Sticky Entries panel */}
      <div className="fixed right-3 top-3 z-50 w-[92vw] max-w-md sm:right-4 sm:top-4">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/70 backdrop-blur-md shadow-[0_0_40px_rgba(0,255,136,0.08)]">
          <button
            type="button"
            onClick={() => setEntriesOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          >
            <div>
              <div className="text-sm font-semibold text-white/85">Entries</div>
              <div className="text-[11px] text-white/50">
                {entries.length} total
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-1 text-[11px] text-emerald-200">
                {entriesOpen ? "Hide" : "Show"}
              </span>
            </div>
          </button>

          {entriesOpen ? (
            <div className="px-4 pb-4">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1.2fr_auto]">
                <div className="relative flex gap-2">
                  <input
                    ref={newWhenRef}
                    type="datetime-local"
                    value={newWhen}
                    onChange={(e) => setNewWhen(e.target.value)}
                    className="relative min-w-0 flex-1 rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white outline-none transition focus:border-emerald-400/50"
                  />
                  <button
                    type="button"
                    onClick={() => openDatetimePicker(newWhenRef)}
                    className="absolute right-0 shrink-0 rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-[11px] text-white/70 hover:border-white/20 hover:text-white"
                  >
                    P
                  </button>
                </div>
                <input
                  type="text"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Text (max 280)"
                  className="rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white outline-none transition focus:border-emerald-400/50"
                />
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onAddEntry}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-400 px-3 py-2 text-xs font-semibold text-black shadow-[0_0_28px_rgba(0,255,136,0.22)] hover:shadow-[0_0_36px_rgba(0,255,136,0.32)]"
                >
                  +
                </motion.button>
              </div>

              <div className="mt-3 max-h-[40vh] overflow-auto rounded-xl border border-white/10">
                <table className="w-full table-fixed text-left text-xs">
                  <thead className="sticky top-0 bg-black/85 backdrop-blur">
                    <tr className="text-white/60">
                      <th className="w-[42%] px-3 py-2">Date time</th>
                      <th className="w-[38%] px-3 py-2">Text</th>
                      <th className="w-[20%] px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entriesLoading ? (
                      <tr>
                        <td className="px-3 py-3 text-white/50" colSpan={3}>
                          Loading…
                        </td>
                      </tr>
                    ) : entries.length === 0 ? (
                      <tr>
                        <td className="px-3 py-3 text-white/50" colSpan={3}>
                          No entries yet.
                        </td>
                      </tr>
                    ) : (
                      entries.map((entry) => {
                        const isEdit = editingId === entry._id;
                        return (
                          <tr
                            key={entry._id}
                            className="border-t border-white/10 align-top hover:bg-white/5"
                          >
                            <td className="px-3 py-2">
                              {isEdit ? (
                                <div className="flex gap-2">
                                  <input
                                    ref={editWhenRef}
                                    type="datetime-local"
                                    value={editWhen}
                                    onChange={(e) =>
                                      setEditWhen(e.target.value)
                                    }
                                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/60 px-2 py-1 text-xs text-white outline-none focus:border-emerald-400/50"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openDatetimePicker(editWhenRef)
                                    }
                                    className="shrink-0 rounded-lg border border-white/10 bg-black/50 px-2 py-1 text-[11px] text-white/70 hover:border-white/20 hover:text-white"
                                  >
                                    Pick
                                  </button>
                                </div>
                              ) : (
                                <div className="text-white/80">
                                  {new Date(entry.when).toLocaleString()}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {isEdit ? (
                                <input
                                  type="text"
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="w-full rounded-lg border border-white/10 bg-black/60 px-2 py-1 text-xs text-white outline-none focus:border-emerald-400/50"
                                />
                              ) : (
                                <div className="truncate text-white/75">
                                  {entry.text}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex justify-end gap-2">
                                {isEdit ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => onUpdateEntry(entry._id)}
                                      className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-2 py-1 text-[11px] text-emerald-200 hover:border-emerald-400/70"
                                    >
                                      Update
                                    </button>
                                    <button
                                      type="button"
                                      onClick={cancelEdit}
                                      className="rounded-lg border border-white/15 bg-black/40 px-2 py-1 text-[11px] text-white/75 hover:border-white/25"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => beginEdit(entry)}
                                      className="rounded-lg border border-green-500/25 bg-black/40 px-2 py-1 text-[11px] text-green-200 hover:border-green-400/45"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onDeleteEntry(entry._id)}
                                      className="rounded-lg border border-red-500/25 bg-red-500/10 px-2 py-1 text-[11px] text-red-200 hover:border-red-400/45"
                                    >
                                      Del
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="text-xs uppercase tracking-[0.25em] text-white/60">
          Persistent Time Since
        </div>

        <button
          type="button"
          onClick={toggleTrackPlayback}
          className="group inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-black/40 px-3 py-2 text-xs text-white/80 backdrop-blur transition hover:border-emerald-400/60 hover:text-white"
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isPlaying
                ? "bg-emerald-400 shadow-[0_0_12px_rgba(0,255,136,0.8)]"
                : "bg-white/30"
            }`}
          />
          {isPlaying ? "Pause Song" : "Play Song"}
        </button>
      </div>

      {isPlaying ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md sm:p-5">
          <div className="mb-2 text-sm text-white/70">Track Control</div>
          <input
            type="range"
            min={0}
            max={duration > 0 ? duration : 1}
            step={0.1}
            value={Math.min(
              seekPreview ?? currentTime,
              duration > 0 ? duration : 1,
            )}
            onPointerDown={() => {
              const el = audioRef.current;
              wasPlayingBeforeSeekRef.current = !!el && !el.paused;
              setIsSeeking(true);
            }}
            onPointerUp={(e) => {
              const el = audioRef.current;
              const next = Number((e.currentTarget as HTMLInputElement).value);
              setIsSeeking(false);
              setSeekPreview(null);
              if (duration > 0) {
                pendingResumeAfterSeekRef.current =
                  !!el && wasPlayingBeforeSeekRef.current;
                onSeekTrack(next);
              }
              wasPlayingBeforeSeekRef.current = false;
            }}
            onInput={(e) => {
              const next = Number((e.target as HTMLInputElement).value);
              setSeekPreview(next);
            }}
            className="w-full accent-emerald-400"
          />
          <div className="mt-1 flex justify-between text-xs text-white/55">
            <span>{formatPlayback(seekPreview ?? currentTime)}</span>
            <span>{duration > 0 ? formatPlayback(duration) : "--:--"}</span>
          </div>
        </div>
      ) : null}

      <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md sm:p-8">
        {startTime == null ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm text-white/70">
                Pick a past date & time
              </label>
              <input
                type="datetime-local"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-white outline-none ring-0 transition focus:border-emerald-400/50 focus:shadow-[0_0_0_4px_rgba(0,255,136,0.12)]"
              />
              <div className="text-xs text-white/45">
                This value is saved as epoch milliseconds in MongoDB.
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onStart}
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-black shadow-[0_0_24px_rgba(0,255,136,0.25)] transition hover:shadow-[0_0_34px_rgba(0,255,136,0.35)]"
              >
                Start Timer
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onReset}
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/15 bg-black/40 px-5 py-3 font-semibold text-white/85 transition hover:border-white/25 hover:text-white"
              >
                Reset
              </motion.button>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="text-sm text-white/50">Loading saved timer…</div>
            ) : (
              <div className="text-sm text-white/50">
                No timer saved yet. Start one above.
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-white/65">
                Start: <span className="text-white/90">{formattedStart}</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onReset}
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-black/40 px-4 py-2 text-sm font-semibold text-white/85 transition hover:border-white/25 hover:text-white"
              >
                Reset
              </motion.button>
            </div>

            <motion.div
              className="relative rounded-2xl border border-emerald-400/15 bg-black/40 px-6 py-10 text-center shadow-[0_0_60px_rgba(0,255,136,0.10)]"
              animate={{
                boxShadow: [
                  "0 0 45px rgba(0,255,136,0.08)",
                  "0 0 70px rgba(0,255,136,0.16)",
                  "0 0 45px rgba(0,255,136,0.08)",
                ],
              }}
              transition={{
                duration: 3.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_50%_40%,rgba(0,255,136,0.12),transparent_55%)]" />

              <motion.div
                className="relative font-mono text-4xl font-semibold tracking-tight text-white sm:text-6xl"
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: [0.98, 1, 0.995], opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                key={`${elapsed?.days}-${elapsed?.hours}-${elapsed?.minutes}-${elapsed?.seconds}`}
              >
                <span className="text-emerald-300">{elapsed?.days ?? 0}</span>
                <span className="text-white/60">d</span>{" "}
                <span>{pad2(elapsed?.hours ?? 0)}</span>
                <span className="text-white/60">:</span>
                <span>{pad2(elapsed?.minutes ?? 0)}</span>
                <span className="text-white/60">:</span>
                <span>{pad2(elapsed?.seconds ?? 0)}</span>
              </motion.div>

              <div className="relative mt-4 text-xs uppercase tracking-[0.3em] text-white/55">
                Elapsed time
              </div>
            </motion.div>

            {error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { toDatetimeLocalValue, formatDate } from "@/lib/utils";
import {
  fetchEntries,
  createEntry,
  updateEntry,
  deleteEntry,
} from "@/lib/api/entries";
import type { EntryItem } from "@/types/timer";

const MAX_TEXT_LENGTH = 280;

export default function EntriesPanel() {
  // ── Data state ──────────────────────────────────────────
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entriesOpen, setEntriesOpen] = useState(true);

  // ── Add form state ──────────────────────────────────────
  const [newWhen, setNewWhen] = useState("");
  const [newText, setNewText] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const newWhenRef = useRef<HTMLInputElement | null>(null);

  // ── Edit form state ─────────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWhen, setEditWhen] = useState("");
  const [editText, setEditText] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const editWhenRef = useRef<HTMLInputElement | null>(null);

  // ── Collapse on small screens ───────────────────────────

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 640px)");
    const apply = () => setEntriesOpen(!mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  // ── Initial fetch ───────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        const data = await fetchEntries();
        if (!cancelled) setEntries(data);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to fetch entries.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Auto-dismiss errors after 5 seconds ─────────────────

  useEffect(() => {
    if (!error) return;
    const id = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(id);
  }, [error]);

  // ── Helpers ─────────────────────────────────────────────

  function openDatetimePicker(ref: React.RefObject<HTMLInputElement | null>) {
    const el = ref.current;
    if (!el) return;
    try {
      (el as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
    } catch {
      /* not supported */
    }
    el.focus();
  }

  const sortEntries = (list: EntryItem[]) =>
    [...list].sort((a, b) => b.when - a.when);

  // ── CRUD handlers ───────────────────────────────────────

  const handleAdd = useCallback(async () => {
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
    if (text.length > MAX_TEXT_LENGTH) {
      setError(`Text must be at most ${MAX_TEXT_LENGTH} characters.`);
      return;
    }

    try {
      setIsAdding(true);
      const entry = await createEntry(when, text);
      setEntries((prev) => sortEntries([entry, ...prev]));
      setNewWhen("");
      setNewText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add entry.");
    } finally {
      setIsAdding(false);
    }
  }, [newWhen, newText]);

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

  const handleUpdate = useCallback(
    async (id: string) => {
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
      if (text.length > MAX_TEXT_LENGTH) {
        setError(`Text must be at most ${MAX_TEXT_LENGTH} characters.`);
        return;
      }

      try {
        setIsUpdating(true);
        const updated = await updateEntry(id, when, text);
        setEntries((prev) =>
          sortEntries(prev.map((e) => (e._id === id ? updated : e))),
        );
        cancelEdit();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update entry.");
      } finally {
        setIsUpdating(false);
      }
    },
    [editWhen, editText],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      setError(null);

      try {
        await deleteEntry(id);
        setEntries((prev) => prev.filter((e) => e._id !== id));
        if (editingId === id) cancelEdit();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete entry.");
      }
    },
    [editingId],
  );

  // ── Render ──────────────────────────────────────────────

  return (
    <div className="fixed right-3 top-3 z-50 w-[92vw] max-w-md sm:right-4 sm:top-4">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/70 shadow-[0_0_40px_rgba(0,255,136,0.08)] backdrop-blur-md">
        {/* Toggle header */}
        <button
          type="button"
          onClick={() => setEntriesOpen((v) => !v)}
          aria-expanded={entriesOpen}
          aria-controls="entries-body"
          className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <div>
            <div className="text-sm font-semibold text-white/85">Entries</div>
            <div className="text-[11px] text-white/50">
              {entries.length} total
            </div>
          </div>
          <span
            className={`rounded-full border px-2 py-1 text-[11px] transition-all duration-200 ${
              !entriesOpen
                ? "border-red-400/25 bg-red-400/10 text-red-200"
                : "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
            }`}
          >
            {!entriesOpen ? "Hide" : "Show"}
          </span>
        </button>

        {/* Collapsible body */}
        {!entriesOpen && (
          <div id="entries-body" className="px-4 pb-4">
            {/* Error banner */}
            {error && (
              <div className="mb-3 flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  aria-label="Dismiss error"
                  className="ml-2 text-red-300 hover:text-white"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Add entry form */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1.2fr_auto]">
              <div className="relative flex gap-2">
                <input
                  ref={newWhenRef}
                  type="datetime-local"
                  value={newWhen}
                  onChange={(e) => setNewWhen(e.target.value)}
                  aria-label="New entry date and time"
                  className="relative min-w-0 flex-1 rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white outline-none transition focus:border-emerald-400/50"
                />
                <button
                  type="button"
                  onClick={() => openDatetimePicker(newWhenRef)}
                  aria-label="Open date picker"
                  className="absolute right-0 shrink-0 rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-[11px] text-white/70 hover:border-white/20 hover:text-white"
                >
                  P
                </button>
              </div>

              <input
                type="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleAdd();
                }}
                maxLength={MAX_TEXT_LENGTH}
                placeholder={`Text (max ${MAX_TEXT_LENGTH})`}
                aria-label="New entry text"
                className="rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white outline-none transition focus:border-emerald-400/50"
              />

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleAdd}
                disabled={isAdding}
                aria-label="Add entry"
                className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-400 px-3 py-2 text-xs font-semibold text-black shadow-[0_0_28px_rgba(0,255,136,0.22)] hover:shadow-[0_0_36px_rgba(0,255,136,0.32)] disabled:opacity-50"
              >
                {isAdding ? "…" : "+"}
              </motion.button>
            </div>

            {/* Entries table */}
            <div className="mt-3 max-h-[40vh] overflow-auto rounded-xl border border-white/10">
              <table className="w-full table-fixed text-left text-xs">
                <thead className="sticky top-0 bg-black/85 backdrop-blur">
                  <tr className="text-white/60">
                    <th className="w-[38%] px-3 py-2">Date time</th>
                    <th className="w-[36%] px-3 py-2">Text</th>
                    {/* <th className="w-[26%] px-3 py-2 text-right">Actions</th> */}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
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
                          {/* Date cell */}
                          <td className="px-3 py-2">
                            {isEdit ? (
                              <div className="flex gap-2">
                                <input
                                  ref={editWhenRef}
                                  type="datetime-local"
                                  value={editWhen}
                                  onChange={(e) => setEditWhen(e.target.value)}
                                  aria-label="Edit entry date and time"
                                  className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/60 px-2 py-1 text-xs text-white outline-none focus:border-emerald-400/50"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    openDatetimePicker(editWhenRef)
                                  }
                                  aria-label="Open date picker"
                                  className="shrink-0 rounded-lg border border-white/10 bg-black/50 px-2 py-1 text-[11px] text-white/70 hover:border-white/20 hover:text-white"
                                >
                                  Pick
                                </button>
                              </div>
                            ) : (
                              <div className="text-white/80">
                                {formatDate(new Date(entry.when).toISOString())}
                              </div>
                            )}
                          </td>

                          {/* Text cell */}
                          <td className="px-3 py-2">
                            {isEdit ? (
                              <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    void handleUpdate(entry._id);
                                  if (e.key === "Escape") cancelEdit();
                                }}
                                maxLength={MAX_TEXT_LENGTH}
                                aria-label="Edit entry text"
                                className="w-full rounded-lg border border-white/10 bg-black/60 px-2 py-1 text-xs text-white outline-none focus:border-emerald-400/50"
                              />
                            ) : (
                              <div className="truncate text-white/75">
                                {entry.text}
                              </div>
                            )}
                          </td>

                          {/* Actions cell */}
                          <td className="px-3 py-2">
                            <div className="flex justify-end gap-2">
                              {isEdit ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdate(entry._id)}
                                    disabled={isUpdating}
                                    className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-2 py-1 text-[11px] text-emerald-200 hover:border-emerald-400/70 disabled:opacity-50"
                                  >
                                    {isUpdating ? "…" : "Save"}
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
                                  {/* <button
                                    type="button"
                                    onClick={() => beginEdit(entry)}
                                    className="rounded-lg border border-green-500/25 bg-black/40 px-2 py-1 text-[11px] text-green-200 hover:border-green-400/45"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(entry._id)}
                                    className="rounded-lg border border-red-500/25 bg-red-500/10 px-2 py-1 text-[11px] text-red-200 hover:border-red-400/45"
                                  >
                                    Del
                                  </button> */}
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
        )}
      </div>
    </div>
  );
}

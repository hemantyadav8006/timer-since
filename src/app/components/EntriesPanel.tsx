"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toDatetimeLocalValue } from "@/lib/utils";
import {
  fetchEntries,
  createEntry,
  updateEntry,
  deleteEntry,
} from "@/lib/api/entries";
import ErrorBanner from "@/components/ui/ErrorBanner";
import type { EntryItem } from "@/types/timer";

const MAX_TEXT = 280;

type EntriesPanelProps = {
  timerId: string;
  color: string;
};

export default function EntriesPanel({ timerId, color }: EntriesPanelProps) {
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const [newWhen, setNewWhen] = useState("");
  const [newText, setNewText] = useState("");
  const [adding, setAdding] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editWhen, setEditWhen] = useState("");
  const [editText, setEditText] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchEntries(timerId)
      .then((d) => {
        if (!cancelled) setEntries(d);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [timerId]);

  useEffect(() => {
    if (!error) return;
    const id = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(id);
  }, [error]);

  const sort = (list: EntryItem[]) => [...list].sort((a, b) => b.when - a.when);

  const handleAdd = useCallback(async () => {
    setError(null);
    if (!newWhen) {
      setError("Select a date & time.");
      return;
    }
    const when = Date.parse(newWhen);
    if (!Number.isFinite(when)) {
      setError("Invalid date.");
      return;
    }
    const text = newText.trim();
    if (!text) {
      setError("Text is required.");
      return;
    }
    if (text.length > MAX_TEXT) {
      setError(`Max ${MAX_TEXT} characters.`);
      return;
    }
    try {
      setAdding(true);
      const entry = await createEntry(when, text, timerId);
      setEntries((p) => sort([entry, ...p]));
      setNewWhen("");
      setNewText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed.");
    } finally {
      setAdding(false);
    }
  }, [newWhen, newText, timerId]);

  function beginEdit(e: EntryItem) {
    setEditId(e._id);
    setEditWhen(toDatetimeLocalValue(e.when));
    setEditText(e.text);
  }
  function cancelEdit() {
    setEditId(null);
    setEditWhen("");
    setEditText("");
  }

  const handleUpdate = useCallback(
    async (id: string) => {
      setError(null);
      const when = Date.parse(editWhen);
      if (!Number.isFinite(when)) {
        setError("Invalid date.");
        return;
      }
      const text = editText.trim();
      if (!text) {
        setError("Text required.");
        return;
      }
      try {
        setUpdating(true);
        const updated = await updateEntry(id, when, text);
        setEntries((p) => sort(p.map((e) => (e._id === id ? updated : e))));
        cancelEdit();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed.");
      } finally {
        setUpdating(false);
      }
    },
    [editWhen, editText],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      setError(null);
      try {
        await deleteEntry(id);
        setEntries((p) => p.filter((e) => e._id !== id));
        if (editId === id) cancelEdit();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed.");
      }
    },
    [editId],
  );

  return (
    <div className="mt-4 rounded-2xl border border-app-border bg-app-surface backdrop-blur-md">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div>
          <div className="text-sm font-semibold text-app-fg">
            Journal Entries
          </div>
          <div className="text-[11px] text-app-muted">
            {entries.length} total
          </div>
        </div>
        <span
          className={`rounded-full border px-2 py-0.5 text-[11px] transition ${
            open ? "" : "border-app-border text-app-muted"
          }`}
          style={
            open
              ? {
                  borderColor: `${color}30`,
                  color,
                  backgroundColor: `${color}10`,
                }
              : undefined
          }
        >
          {open ? "Hide" : "Show"}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4">
          <ErrorBanner
            message={error}
            onDismiss={() => setError(null)}
            className="mb-3"
          />

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="datetime-local"
              value={newWhen}
              onChange={(e) => setNewWhen(e.target.value)}
              aria-label="Entry date"
              className="min-w-0 flex-1 rounded-xl border border-app-border bg-app-input px-3 py-2 text-xs text-app-fg outline-none focus:border-app-fg/25"
            />
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleAdd();
              }}
              maxLength={MAX_TEXT}
              placeholder="Write something..."
              aria-label="Entry text"
              className="min-w-0 flex-[1.5] rounded-xl border border-app-border bg-app-input px-3 py-2 text-xs text-app-fg outline-none focus:border-app-fg/25"
            />
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={handleAdd}
              disabled={adding}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-black disabled:opacity-50"
              style={{ backgroundColor: color }}
            >
              {adding ? "..." : "+"}
            </motion.button>
          </div>

          <div className="mt-3 max-h-[40vh] overflow-auto rounded-xl border border-app-border">
            <table className="w-full table-fixed text-left text-xs">
              <thead className="sticky top-0 bg-app-surface-strong backdrop-blur">
                <tr className="text-app-muted">
                  <th className="w-[32%] px-3 py-2">Date/time</th>
                  <th className="w-[43%] px-3 py-2">Text</th>
                  <th className="w-[25%] px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-3 py-3 text-app-muted" colSpan={3}>
                      Loading...
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3 text-app-muted" colSpan={3}>
                      No entries yet.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => {
                    const isEdit = editId === entry._id;
                    return (
                      <tr
                        key={entry._id}
                        className="border-t border-app-border align-top hover:bg-app-surface"
                      >
                        <td className="px-3 py-2">
                          {isEdit ? (
                            <input
                              type="datetime-local"
                              value={editWhen}
                              onChange={(e) => setEditWhen(e.target.value)}
                              className="w-full rounded-lg border border-app-border bg-app-input px-2 py-1 text-xs text-app-fg outline-none"
                            />
                          ) : (
                            <span className="text-app-fg">
                              {new Date(entry.when).toLocaleString()}
                            </span>
                          )}
                        </td>
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
                              maxLength={MAX_TEXT}
                              className="w-full rounded-lg border border-app-border bg-app-input px-2 py-1 text-xs text-app-fg outline-none"
                            />
                          ) : (
                            <span className="text-app-muted">{entry.text}</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-1">
                            {isEdit ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleUpdate(entry._id)}
                                  disabled={updating}
                                  className="rounded-lg border px-2 py-1 text-[10px] disabled:opacity-50"
                                  style={{ borderColor: `${color}40`, color }}
                                >
                                  {updating ? "..." : "Save"}
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  className="rounded-lg border border-app-border px-2 py-1 text-[10px] text-app-muted"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => beginEdit(entry)}
                                  className="rounded-lg border border-app-border px-2 py-1 text-[10px] text-app-muted hover:text-app-fg"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(entry._id)}
                                  className="rounded-lg border border-red-500/20 px-2 py-1 text-[10px] text-app-danger hover:text-app-danger-hover"
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
      )}
    </div>
  );
}

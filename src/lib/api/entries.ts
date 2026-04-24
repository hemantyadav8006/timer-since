/* ──────────────────────────────────────────────────────────
 *  Entries API service — typed CRUD with proper error handling.
 * ────────────────────────────────────────────────────────── */

import type {
  EntryItem,
  EntriesApiResponse,
  EntryApiResponse,
  DeleteApiResponse,
} from "@/types/timer";

/** Fetch all entries sorted by `when` descending. */
export async function fetchEntries(): Promise<EntryItem[]> {
  const res = await fetch("/api/entries", { cache: "no-store" });
  const data = (await res.json()) as EntriesApiResponse;

  if (!res.ok || "error" in data) {
    throw new Error("error" in data ? data.error : "Failed to fetch entries.");
  }

  return data.entries;
}

/** Create a new entry. Returns the created document. */
export async function createEntry(
  when: number,
  text: string,
): Promise<EntryItem> {
  const res = await fetch("/api/entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ when, text }),
  });

  const data = (await res.json()) as EntryApiResponse;

  if (!res.ok || "error" in data) {
    throw new Error("error" in data ? data.error : "Failed to add entry.");
  }

  return data.entry;
}

/** Update an existing entry by ID. Returns the updated document. */
export async function updateEntry(
  id: string,
  when: number,
  text: string,
): Promise<EntryItem> {
  const res = await fetch(`/api/entries/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ when, text }),
  });

  const data = (await res.json()) as EntryApiResponse;

  if (!res.ok || "error" in data) {
    throw new Error("error" in data ? data.error : "Failed to update entry.");
  }

  return data.entry;
}

/** Delete an entry by ID. */
export async function deleteEntry(id: string): Promise<void> {
  const res = await fetch(`/api/entries/${id}`, { method: "DELETE" });
  const data = (await res.json()) as DeleteApiResponse;

  if (!res.ok || "error" in data) {
    throw new Error("error" in data ? data.error : "Failed to delete entry.");
  }
}

import type {
  EntryItem,
  EntriesApiResponse,
  EntryApiResponse,
  DeleteApiResponse,
} from "@/types/timer";

export async function fetchEntries(timerId?: string): Promise<EntryItem[]> {
  const url = timerId
    ? `/api/entries?timerId=${timerId}`
    : "/api/entries";
  const res = await fetch(url, { cache: "no-store" });
  const data = (await res.json()) as EntriesApiResponse;
  if (!res.ok || "error" in data) {
    throw new Error("error" in data ? data.error : "Failed to fetch entries.");
  }
  return data.entries;
}

export async function createEntry(
  when: number,
  text: string,
  timerId?: string,
): Promise<EntryItem> {
  const res = await fetch("/api/entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ when, text, timerId }),
  });
  const data = (await res.json()) as EntryApiResponse;
  if (!res.ok || "error" in data) {
    throw new Error("error" in data ? data.error : "Failed to add entry.");
  }
  return data.entry;
}

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

export async function deleteEntry(id: string): Promise<void> {
  const res = await fetch(`/api/entries/${id}`, { method: "DELETE" });
  const data = (await res.json()) as DeleteApiResponse;
  if (!res.ok || "error" in data) {
    throw new Error("error" in data ? data.error : "Failed to delete entry.");
  }
}

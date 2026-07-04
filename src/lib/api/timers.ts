import type {
  TimerItem,
  TimersApiResponse,
  TimerApiResponse,
  DeleteApiResponse,
  CreateTimerPayload,
  UpdateTimerPayload,
  SortOption,
} from "@/types/timer";

type FetchTimersParams = {
  archived?: boolean;
  category?: string;
  tag?: string;
  favorite?: boolean;
  pinned?: boolean;
  mode?: string;
  sort?: SortOption;
  q?: string;
  limit?: number;
  skip?: number;
};

export async function fetchTimers(
  params: FetchTimersParams = {},
): Promise<{ timers: TimerItem[]; total: number }> {
  const sp = new URLSearchParams();
  if (params.archived) sp.set("archived", "true");
  if (params.category) sp.set("category", params.category);
  if (params.tag) sp.set("tag", params.tag);
  if (params.favorite) sp.set("favorite", "true");
  if (params.pinned) sp.set("pinned", "true");
  if (params.mode) sp.set("mode", params.mode);
  if (params.sort) sp.set("sort", params.sort);
  if (params.q) sp.set("q", params.q);
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.skip) sp.set("skip", String(params.skip));

  const res = await fetch(`/api/timers?${sp.toString()}`, { cache: "no-store" });
  const data = await res.json();
  if (!res.ok || "error" in data) {
    throw new Error(data.error ?? "Failed to fetch timers.");
  }
  return { timers: data.timers, total: data.total ?? data.timers.length };
}

export async function fetchTimer(id: string): Promise<TimerItem> {
  const res = await fetch(`/api/timers/${id}`, { cache: "no-store" });
  const data = (await res.json()) as TimerApiResponse;
  if (!res.ok || "error" in data) {
    throw new Error("error" in data ? data.error : "Failed to fetch timer.");
  }
  return data.timer;
}

export async function createTimer(payload: CreateTimerPayload): Promise<TimerItem> {
  const res = await fetch("/api/timers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as TimerApiResponse;
  if (!res.ok || "error" in data) {
    throw new Error("error" in data ? data.error : "Failed to create timer.");
  }
  return data.timer;
}

export async function updateTimer(
  id: string,
  updates: UpdateTimerPayload,
): Promise<TimerItem> {
  const res = await fetch(`/api/timers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  const data = (await res.json()) as TimerApiResponse;
  if (!res.ok || "error" in data) {
    throw new Error("error" in data ? data.error : "Failed to update timer.");
  }
  return data.timer;
}

export async function deleteTimer(id: string): Promise<void> {
  const res = await fetch(`/api/timers/${id}`, { method: "DELETE" });
  const data = (await res.json()) as DeleteApiResponse;
  if (!res.ok || "error" in data) {
    throw new Error("error" in data ? data.error : "Failed to delete timer.");
  }
}

export async function duplicateTimer(timer: TimerItem): Promise<TimerItem> {
  return createTimer({
    title: `${timer.title} (copy)`,
    description: timer.description,
    icon: timer.icon,
    color: timer.color,
    category: timer.category,
    tags: timer.tags,
    mode: timer.mode,
    startDate: timer.startDate,
    targetDate: timer.targetDate,
    sound: timer.sound,
    milestoneConfig: timer.milestoneConfig,
  });
}

export async function fetchSharedTimer(shareId: string): Promise<TimerItem> {
  const res = await fetch(`/api/share/${shareId}`, { cache: "no-store" });
  const data = (await res.json()) as TimerApiResponse;
  if (!res.ok || "error" in data) {
    throw new Error("error" in data ? data.error : "Timer not found.");
  }
  return data.timer;
}

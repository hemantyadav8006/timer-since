import { assertSuccess } from "@/lib/api/http";
import type { YouTubeSearchResult } from "@/lib/youtube-shared";

export type { YouTubeSearchResult };

export async function searchYouTube(
  query: string,
  signal?: AbortSignal,
): Promise<YouTubeSearchResult[]> {
  const res = await fetch(
    `/api/youtube/search?q=${encodeURIComponent(query.trim().slice(0, 100))}`,
    { cache: "no-store", signal },
  );
  const data = (await res.json()) as
    | { results: YouTubeSearchResult[] }
    | { error: string };
  assertSuccess(res, data, "Failed to search YouTube.");
  return "results" in data ? data.results : [];
}

import {
  decodeYouTubeText,
  isValidYouTubeVideoId,
  type YouTubeSearchResult,
} from "@/lib/youtube-shared";

export type { YouTubeSearchResult };
export {
  YOUTUBE_VIDEO_ID_RE,
  decodeYouTubeText,
  isValidYouTubeVideoId,
  sanitizeYouTubeFields,
} from "@/lib/youtube-shared";

type CacheEntry = {
  expiresAt: number;
  results: YouTubeSearchResult[];
};

const SEARCH_CACHE = new Map<string, CacheEntry>();
const INFLIGHT = new Map<string, Promise<YouTubeSearchResult[]>>();
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 50;

type YouTubeSearchItem = {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    channelTitle?: string;
    thumbnails?: {
      medium?: { url?: string };
      default?: { url?: string };
    };
  };
};

type YouTubeSearchResponse = {
  items?: YouTubeSearchItem[];
  error?: { message?: string; errors?: { reason?: string }[] };
};

function trimCache() {
  if (SEARCH_CACHE.size <= MAX_CACHE_ENTRIES) return;
  const oldest = SEARCH_CACHE.keys().next().value;
  if (oldest) SEARCH_CACHE.delete(oldest);
}

export async function searchYouTubeVideos(
  query: string,
  apiKey: string,
  maxResults = 8,
): Promise<YouTubeSearchResult[]> {
  const q = query.trim().slice(0, 100);
  if (!q) return [];

  const cacheKey = `${q.toLowerCase()}|${maxResults}`;
  const cached = SEARCH_CACHE.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.results;
  }

  const inflight = INFLIGHT.get(cacheKey);
  if (inflight) return inflight;

  const request = (async () => {
    const params = new URLSearchParams({
      part: "snippet",
      type: "video",
      videoEmbeddable: "true",
      maxResults: String(Math.min(Math.max(maxResults, 1), 15)),
      q,
      key: apiKey,
    });

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params}`,
      { next: { revalidate: 0 } },
    );

    let data: YouTubeSearchResponse;
    try {
      data = (await res.json()) as YouTubeSearchResponse;
    } catch {
      throw new Error("YouTube returned an invalid response.");
    }

    if (!res.ok) {
      const reason = data.error?.errors?.[0]?.reason;
      if (reason === "quotaExceeded" || reason === "dailyLimitExceeded") {
        throw new Error("YouTube search quota exceeded. Try again tomorrow.");
      }
      if (reason === "keyInvalid") {
        throw new Error("YouTube API key is invalid.");
      }
      throw new Error(data.error?.message ?? "YouTube search failed.");
    }

    const results: YouTubeSearchResult[] = (data.items ?? [])
      .map((item) => {
        const videoId = item.id?.videoId;
        if (!isValidYouTubeVideoId(videoId)) return null;
        const thumb =
          item.snippet?.thumbnails?.medium?.url ??
          item.snippet?.thumbnails?.default?.url ??
          "";
        return {
          videoId,
          title: decodeYouTubeText(item.snippet?.title ?? "Untitled").slice(
            0,
            200,
          ),
          channelTitle: decodeYouTubeText(item.snippet?.channelTitle ?? ""),
          thumbnail: thumb.startsWith("https://") ? thumb : "",
        } satisfies YouTubeSearchResult;
      })
      .filter((item): item is YouTubeSearchResult => item !== null);

    SEARCH_CACHE.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      results,
    });
    trimCache();
    return results;
  })();

  INFLIGHT.set(cacheKey, request);
  try {
    return await request;
  } finally {
    INFLIGHT.delete(cacheKey);
  }
}

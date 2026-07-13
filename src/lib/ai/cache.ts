import type { TimerDraft } from "@/lib/ai/schema";
import { createHash } from "crypto";

type CacheEntry = {
  expiresAt: number;
  draft: TimerDraft;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
};

const CACHE = new Map<string, CacheEntry>();
const INFLIGHT = new Map<string, Promise<CacheEntry>>();
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 50;

export function hashParsePrompt(prompt: string, nowBucketMs: number): string {
  return createHash("sha256")
    .update(`${prompt.trim().toLowerCase()}|${nowBucketMs}`)
    .digest("hex");
}

export function getCachedParse(key: string): CacheEntry | null {
  const entry = CACHE.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    CACHE.delete(key);
    return null;
  }
  return entry;
}

export function setCachedParse(
  key: string,
  draft: TimerDraft,
  usage: CacheEntry["usage"],
  model: string,
): CacheEntry {
  if (CACHE.size >= MAX_CACHE_ENTRIES) {
    const oldest = CACHE.keys().next().value;
    if (oldest) CACHE.delete(oldest);
  }
  const entry: CacheEntry = {
    expiresAt: Date.now() + CACHE_TTL_MS,
    draft,
    usage,
    model,
  };
  CACHE.set(key, entry);
  return entry;
}

/**
 * Deduplicate concurrent identical parses (YouTube-style inflight map).
 */
export async function getOrRunCachedParse(
  key: string,
  run: () => Promise<{
    draft: TimerDraft;
    usage: CacheEntry["usage"];
    model: string;
  }>,
): Promise<{ entry: CacheEntry; cached: boolean }> {
  const cached = getCachedParse(key);
  if (cached) return { entry: cached, cached: true };

  const existing = INFLIGHT.get(key);
  if (existing) {
    const entry = await existing;
    return { entry, cached: true };
  }

  const promise = (async () => {
    const result = await run();
    return setCachedParse(key, result.draft, result.usage, result.model);
  })();

  INFLIGHT.set(key, promise);
  try {
    const entry = await promise;
    return { entry, cached: false };
  } finally {
    INFLIGHT.delete(key);
  }
}

export function nowBucket(nowMs: number, bucketSizeMs = 5 * 60 * 1000): number {
  return Math.floor(nowMs / bucketSizeMs) * bucketSizeMs;
}

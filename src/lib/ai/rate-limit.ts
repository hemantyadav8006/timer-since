/**
 * Per-user rate limiting for AI endpoints (in-memory, atomic consume).
 */

import { AI_PARSE_MAX_PER_HOUR } from "@/lib/ai/constants";

const WINDOW_MS = 60 * 60 * 1000;
export { AI_PARSE_MAX_PER_HOUR };

type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();

function prune(timestamps: number[], now: number): number[] {
  return timestamps.filter((t) => now - t < WINDOW_MS);
}

/**
 * Atomically check + consume one slot.
 * Avoids check-then-record races that could exceed the limit under concurrency.
 */
export function consumeAiRateLimit(
  userId: string,
  now = Date.now(),
): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  const key = `parse-timer:${userId}`;
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = prune(bucket.timestamps, now);

  if (bucket.timestamps.length >= AI_PARSE_MAX_PER_HOUR) {
    const oldest = bucket.timestamps[0]!;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((WINDOW_MS - (now - oldest)) / 1000),
    );
    buckets.set(key, bucket);
    return { allowed: false, retryAfterSeconds };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return { allowed: true };
}

/** @deprecated Prefer consumeAiRateLimit — kept for eval/tests. */
export function checkAiRateLimit(
  userId: string,
  now = Date.now(),
): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  const key = `parse-timer:${userId}`;
  const bucket = buckets.get(key) ?? { timestamps: [] };
  const timestamps = prune(bucket.timestamps, now);
  if (timestamps.length >= AI_PARSE_MAX_PER_HOUR) {
    const oldest = timestamps[0]!;
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((WINDOW_MS - (now - oldest)) / 1000),
      ),
    };
  }
  return { allowed: true };
}

export function recordAiRateLimitHit(userId: string, now = Date.now()): void {
  consumeAiRateLimit(userId, now);
}

/** Test helper — clears in-memory buckets. */
export function _resetAiRateLimitsForTests(): void {
  buckets.clear();
}

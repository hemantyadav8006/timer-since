export const PARSE_TIMER_MAX_PROMPT_CHARS = 1000;
export const PARSE_TIMER_MIN_PROMPT_CHARS = 3;
export const AI_PARSE_MAX_PER_HOUR = 10;
/** Per-model attempt budget (JSON generateContent is usually ~15–30s on free tier). */
export const AI_PARSE_TIMEOUT_MS = 60_000;
/** Max models to try for one user request (preferred + fallbacks). */
export const AI_PARSE_MAX_MODEL_ATTEMPTS = 2;

/**
 * Default Gemini model for new AI Studio keys.
 * Pinned ids like gemini-2.5-flash / gemini-3-flash often 404 for new users.
 */
export const AI_PARSE_MODEL_DEFAULT = "gemini-flash-latest";

/**
 * Tried in order when the primary model returns quota, timeout, or unavailable.
 */
export const AI_PARSE_FALLBACK_MODELS = [
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite",
] as const;

/**
 * Still appear in Google's model list for some keys, but generateContent returns
 * 404 "no longer available to new users". Hide from picker and skip in fallbacks.
 */
export const AI_BLOCKED_MODEL_IDS = [
  "gemini-2.5-flash",
  "gemini-3-flash",
] as const;

export const AI_API_KEY_ENV = "GOOGLE_GENERATIVE_AI_API_KEY";
export const AI_MODEL_ENV = "GEMINI_MODEL";

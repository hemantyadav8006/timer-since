export const PARSE_TIMER_MAX_PROMPT_CHARS = 1000;
export const PARSE_TIMER_MIN_PROMPT_CHARS = 3;
export const AI_PARSE_MAX_PER_HOUR = 10;
export const AI_PARSE_TIMEOUT_MS = 20_000;

/**
 * Default Gemini model (matches mystery-message; Flash-Lite is closed to new users).
 */
export const AI_PARSE_MODEL_DEFAULT = "gemini-2.5-flash";

/**
 * Tried in order when the primary model returns quota or "model unavailable".
 * Do not include *-flash-lite — Google has restricted those for new API users.
 */
export const AI_PARSE_FALLBACK_MODELS = ["gemini-3-flash"] as const;

export const AI_API_KEY_ENV = "GOOGLE_GENERATIVE_AI_API_KEY";
export const AI_MODEL_ENV = "GEMINI_MODEL";

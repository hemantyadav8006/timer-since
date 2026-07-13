/**
 * Core NL → timer draft pipeline (server-only).
 * Provider: Google Gemini via @ai-sdk/google
 */

import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { validateTimerFields } from "@/lib/api/timer-validation";
import {
  buildParseTimerSystemPrompt,
  buildParseTimerUserPrompt,
} from "@/lib/ai/prompt";
import {
  draftToCreatePayload,
  timerDraftSchema,
  type TimerDraft,
} from "@/lib/ai/schema";
import {
  getOrRunCachedParse,
  hashParsePrompt,
  nowBucket,
} from "@/lib/ai/cache";
import {
  AI_API_KEY_ENV,
  AI_MODEL_ENV,
  AI_PARSE_FALLBACK_MODELS,
  AI_PARSE_MODEL_DEFAULT,
  AI_PARSE_TIMEOUT_MS,
} from "@/lib/ai/constants";

export const AI_PARSE_MODEL =
  process.env[AI_MODEL_ENV]?.trim() || AI_PARSE_MODEL_DEFAULT;
export { AI_PARSE_TIMEOUT_MS };

function modelCandidates(primary: string): string[] {
  const seen = new Set<string>();
  const list: string[] = [];
  for (const m of [primary, ...AI_PARSE_FALLBACK_MODELS]) {
    const id = m.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    list.push(id);
  }
  return list;
}

function isQuotaOrRateLimitError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();
  return (
    lower.includes("quota") ||
    lower.includes("rate limit") ||
    lower.includes("resource_exhausted") ||
    lower.includes("429") ||
    lower.includes("exceeded your current quota")
  );
}

function isModelUnavailableError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();
  return (
    lower.includes("no longer available") ||
    lower.includes("not available to new users") ||
    lower.includes("model not found") ||
    lower.includes("is not found") ||
    lower.includes("invalid model")
  );
}

/** Errors where trying the next model in the fallback chain is useful. */
function isRetriableWithFallback(err: unknown): boolean {
  if (err instanceof ParseTimerError) {
    return (
      err.code === "AI_QUOTA_EXCEEDED" || err.code === "AI_MODEL_UNAVAILABLE"
    );
  }
  return isQuotaOrRateLimitError(err) || isModelUnavailableError(err);
}

function providerErrorToParseError(err: unknown): ParseTimerError {
  if (isQuotaOrRateLimitError(err)) {
    return new ParseTimerError(
      "Gemini free-tier quota is exhausted for this model/project. Wait a bit, or check https://ai.dev/rate-limit. You can still use a template.",
      "AI_QUOTA_EXCEEDED",
      429,
    );
  }
  if (isModelUnavailableError(err)) {
    return new ParseTimerError(
      "That Gemini model is not available for this API key. Trying another model or set GEMINI_MODEL in .env.",
      "AI_MODEL_UNAVAILABLE",
      502,
    );
  }
  const message =
    err instanceof Error ? err.message : "Failed to parse timer description.";
  const short = message.split("\n")[0]?.slice(0, 280) || message;
  return new ParseTimerError(short, "AI_PROVIDER_ERROR", 502);
}

export function isAiConfigured(): boolean {
  return Boolean(process.env[AI_API_KEY_ENV]?.trim());
}

export type ParseTimerResult = {
  draft: TimerDraft;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cached: boolean;
  latencyMs: number;
  model: string;
};

export class ParseTimerError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status = 502) {
    super(message);
    this.name = "ParseTimerError";
    this.code = code;
    this.status = status;
  }
}

async function validationErrorMessage(
  draft: TimerDraft,
): Promise<string | null> {
  const payload = draftToCreatePayload(draft);
  const res = validateTimerFields(payload, { isCreate: true });
  if (!res) return null;
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? "Invalid timer draft.";
  } catch {
    return "Invalid timer draft.";
  }
}

/** Roll a past countdown target forward by whole years until it's in the future. */
function rollForwardTarget(targetMs: number, nowMs: number): number {
  const d = new Date(targetMs);
  while (d.getTime() <= nowMs) {
    d.setFullYear(d.getFullYear() + 1);
  }
  return d.getTime();
}

function sanitizeDraft(draft: TimerDraft, nowMs: number): TimerDraft {
  const next: TimerDraft = {
    ...draft,
    assumptions: [...(draft.assumptions ?? [])],
    tags: [...(draft.tags ?? [])],
    milestones: [...(draft.milestones ?? [])],
  };

  if (next.mode === "elapsed") {
    next.targetDate = null;
    if (!Number.isFinite(next.startDate)) {
      next.startDate = nowMs;
      next.assumptions = [
        ...next.assumptions,
        "Assumed start date = now (missing/invalid start).",
      ].slice(0, 8);
    } else if (next.startDate > nowMs + 60_000) {
      next.startDate = nowMs;
      next.assumptions = [
        ...next.assumptions,
        "Clamped start date to now (elapsed cannot start in the future).",
      ].slice(0, 8);
    }
  } else {
    if (next.targetDate == null || !Number.isFinite(next.targetDate)) {
      next.targetDate = nowMs + 7 * 24 * 60 * 60 * 1000;
      next.assumptions = [
        ...next.assumptions,
        "Defaulted countdown target to 7 days from now.",
      ].slice(0, 8);
    } else if (next.targetDate <= nowMs) {
      const rolled = rollForwardTarget(next.targetDate, nowMs);
      next.assumptions = [
        ...next.assumptions,
        `Countdown target was in the past; rolled forward to ${new Date(rolled).toISOString()}.`,
      ].slice(0, 8);
      next.targetDate = rolled;
    }
    next.startDate = nowMs;
  }

  next.title = next.title.trim().slice(0, 120) || "My Timer";
  next.description = (next.description ?? "").slice(0, 500);
  next.tags = next.tags
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 20);
  next.milestones = next.milestones
    .filter(
      (m) =>
        m.label?.trim() &&
        Number.isFinite(m.durationMs) &&
        m.durationMs > 0,
    )
    .slice(0, 12)
    .map((m) => ({
      label: m.label.trim().slice(0, 80),
      durationMs: m.durationMs,
      icon: (m.icon || "🏆").slice(0, 8),
    }));
  next.assumptions = next.assumptions
    .map((a) => a.trim())
    .filter(Boolean)
    .slice(0, 8);

  return next;
}

async function callModel(
  prompt: string,
  nowMs: number,
  repairHint?: string,
  modelId: string = AI_PARSE_MODEL,
): Promise<{
  draft: TimerDraft;
  usage: ParseTimerResult["usage"];
  model: string;
}> {
  const apiKey = process.env[AI_API_KEY_ENV]?.trim();
  if (!apiKey) {
    throw new ParseTimerError(
      `AI timer creation is not configured. Add ${AI_API_KEY_ENV} to the server environment.`,
      "AI_NOT_CONFIGURED",
      503,
    );
  }

  const google = createGoogleGenerativeAI({ apiKey });
  const system = buildParseTimerSystemPrompt(nowMs);
  const user = repairHint
    ? `${buildParseTimerUserPrompt(prompt, nowMs)}\n\nVALIDATION_ERRORS:\n${repairHint}\nFix the draft to satisfy validation.`
    : buildParseTimerUserPrompt(prompt, nowMs);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_PARSE_TIMEOUT_MS);

  try {
    const result = await generateObject({
      model: google(modelId),
      schema: timerDraftSchema,
      schemaName: "TimerDraft",
      schemaDescription: "Structured timer configuration for Time Since",
      system,
      prompt: user,
      temperature: 0.2,
      maxRetries: 0, // we handle model fallback ourselves
      abortSignal: controller.signal,
    });

    const usage = {
      promptTokens: result.usage?.inputTokens ?? 0,
      completionTokens: result.usage?.outputTokens ?? 0,
      totalTokens: result.usage?.totalTokens ?? 0,
    };

    return { draft: result.object, usage, model: modelId };
  } catch (err) {
    if (err instanceof ParseTimerError) throw err;
    if (controller.signal.aborted) {
      throw new ParseTimerError(
        "AI request timed out. Please try again or use a template.",
        "AI_TIMEOUT",
        504,
      );
    }
    throw providerErrorToParseError(err);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Try primary + fallback models when free-tier quota is 0 / exhausted.
 */
async function callModelWithFallback(
  prompt: string,
  nowMs: number,
  repairHint?: string,
): Promise<{
  draft: TimerDraft;
  usage: ParseTimerResult["usage"];
  model: string;
}> {
  const candidates = modelCandidates(AI_PARSE_MODEL);
  let lastError: ParseTimerError | null = null;

  for (const modelId of candidates) {
    try {
      return await callModel(prompt, nowMs, repairHint, modelId);
    } catch (err) {
      if (isRetriableWithFallback(err)) {
        const code =
          err instanceof ParseTimerError ? err.code : "AI_PROVIDER_ERROR";
        lastError =
          err instanceof ParseTimerError
            ? err
            : providerErrorToParseError(err);
        console.warn(`[ai] ${code} on ${modelId}, trying next model…`);
        continue;
      }
      throw err;
    }
  }

  throw (
    lastError ??
    new ParseTimerError(
      "All Gemini models are unavailable right now. Please try a template.",
      "AI_QUOTA_EXCEEDED",
      429,
    )
  );
}

async function produceValidatedDraft(
  prompt: string,
  nowMs: number,
): Promise<{
  draft: TimerDraft;
  usage: ParseTimerResult["usage"];
  model: string;
}> {
  let { draft, usage, model } = await callModelWithFallback(prompt, nowMs);
  draft = sanitizeDraft(draft, nowMs);

  let validationError = await validationErrorMessage(draft);
  if (validationError) {
    const repaired = await callModelWithFallback(
      prompt,
      nowMs,
      validationError,
    );
    usage = {
      promptTokens: usage.promptTokens + repaired.usage.promptTokens,
      completionTokens:
        usage.completionTokens + repaired.usage.completionTokens,
      totalTokens: usage.totalTokens + repaired.usage.totalTokens,
    };
    model = repaired.model;
    draft = sanitizeDraft(repaired.draft, nowMs);
    validationError = await validationErrorMessage(draft);
    if (validationError) {
      throw new ParseTimerError(
        `Could not produce a valid timer: ${validationError}`,
        "AI_VALIDATION_FAILED",
        422,
      );
    }
  }

  const parsed = timerDraftSchema.safeParse(draft);
  if (!parsed.success) {
    throw new ParseTimerError(
      "AI returned an invalid draft schema.",
      "AI_SCHEMA_INVALID",
      422,
    );
  }

  return { draft: parsed.data, usage, model };
}

/**
 * Parse natural language into a validated timer draft.
 * Uses cache + inflight dedupe, one validation repair pass, and domain validators.
 */
export async function parseTimerFromPrompt(
  prompt: string,
  opts: { nowMs?: number } = {},
): Promise<ParseTimerResult> {
  const nowMs = opts.nowMs ?? Date.now();
  const started = Date.now();
  const cacheKey = hashParsePrompt(prompt, nowBucket(nowMs));

  const { entry, cached } = await getOrRunCachedParse(cacheKey, () =>
    produceValidatedDraft(prompt, nowMs),
  );

  return {
    draft: entry.draft,
    usage: entry.usage,
    cached,
    latencyMs: Date.now() - started,
    model: entry.model,
  };
}

/**
 * Core NL → timer draft pipeline (server-only).
 * Provider: Google Gemini via @google/generative-ai (JSON schema).
 * Avoids Vercel AI SDK generateObject, which hangs on this schema + free tier.
 */

import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { validateTimerFields } from "@/lib/api/timer-validation";
import {
  buildParseTimerSystemPrompt,
  buildParseTimerUserPrompt,
} from "@/lib/ai/prompt";
import { TIMER_DRAFT_RESPONSE_SCHEMA } from "@/lib/ai/gemini-response-schema";
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
  AI_BLOCKED_MODEL_IDS,
  AI_MODEL_ENV,
  AI_PARSE_FALLBACK_MODELS,
  AI_PARSE_MAX_MODEL_ATTEMPTS,
  AI_PARSE_MODEL_DEFAULT,
  AI_PARSE_TIMEOUT_MS,
} from "@/lib/ai/constants";

export const AI_PARSE_MODEL = resolvePreferredModel(
  process.env[AI_MODEL_ENV]?.trim() || AI_PARSE_MODEL_DEFAULT,
);
export { AI_PARSE_TIMEOUT_MS };

function isBlockedModel(id: string): boolean {
  return (AI_BLOCKED_MODEL_IDS as readonly string[]).includes(id);
}

function resolvePreferredModel(id: string): string {
  const trimmed = id.trim();
  if (!trimmed || isBlockedModel(trimmed)) return AI_PARSE_MODEL_DEFAULT;
  return trimmed;
}

function modelCandidates(primary: string): string[] {
  const seen = new Set<string>();
  const list: string[] = [];
  for (const m of [
    resolvePreferredModel(primary),
    AI_PARSE_MODEL,
    ...AI_PARSE_FALLBACK_MODELS,
  ]) {
    const id = m.trim();
    if (!id || seen.has(id) || isBlockedModel(id)) continue;
    seen.add(id);
    list.push(id);
  }
  return list.slice(0, AI_PARSE_MAX_MODEL_ATTEMPTS);
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
    lower.includes("invalid model") ||
    lower.includes("not_found")
  );
}

function isTimeoutError(err: unknown, aborted: boolean): boolean {
  if (aborted) return true;
  if (err instanceof ParseTimerError) return err.code === "AI_TIMEOUT";
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();
  return (
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("aborted") ||
    lower.includes("abort")
  );
}

/** Errors where trying the next model in the fallback chain is useful. */
function isRetriableWithFallback(err: unknown, aborted = false): boolean {
  if (isTimeoutError(err, aborted)) return true;
  if (err instanceof ParseTimerError) {
    return (
      err.code === "AI_QUOTA_EXCEEDED" ||
      err.code === "AI_MODEL_UNAVAILABLE" ||
      err.code === "AI_TIMEOUT"
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
      "That Gemini model is not available for this API key. Trying another model, or pick gemini-flash-latest.",
      "AI_MODEL_UNAVAILABLE",
      502,
    );
  }
  if (isTimeoutError(err, false)) {
    return new ParseTimerError(
      "AI request timed out. Please try again or switch model (gemini-flash-latest works best).",
      "AI_TIMEOUT",
      504,
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
        m.label?.trim() && Number.isFinite(m.durationMs) && m.durationMs > 0,
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

/** Drop JSON nulls so Zod defaults apply; keep targetDate null for elapsed. */
function coerceLlmJson(raw: unknown): unknown {
  if (Array.isArray(raw)) return raw.map(coerceLlmJson);
  if (raw && typeof raw === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(raw)) {
      if (value === null && key !== "targetDate") continue;
      out[key] = coerceLlmJson(value);
    }
    return out;
  }
  return raw;
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

  const system = buildParseTimerSystemPrompt(nowMs);
  const user = repairHint
    ? `${buildParseTimerUserPrompt(prompt, nowMs)}\n\nVALIDATION_ERRORS:\n${repairHint}\nFix the draft to satisfy validation.`
    : buildParseTimerUserPrompt(prompt, nowMs);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelId,
    systemInstruction: system,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: TIMER_DRAFT_RESPONSE_SCHEMA,
    },
  });

  let timedOut = false;
  try {
    const result = await Promise.race([
      model.generateContent(user),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          timedOut = true;
          reject(new Error("AI request timed out"));
        }, AI_PARSE_TIMEOUT_MS);
      }),
    ]);

    const text = result.response.text();
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      throw new ParseTimerError(
        "AI returned non-JSON output.",
        "AI_SCHEMA_INVALID",
        422,
      );
    }

    const parsed = timerDraftSchema.safeParse(coerceLlmJson(raw));
    if (!parsed.success) {
      throw new ParseTimerError(
        "AI returned an invalid draft schema.",
        "AI_SCHEMA_INVALID",
        422,
      );
    }

    const meta = result.response.usageMetadata;
    const usage = {
      promptTokens: meta?.promptTokenCount ?? 0,
      completionTokens: meta?.candidatesTokenCount ?? 0,
      totalTokens: meta?.totalTokenCount ?? 0,
    };

    return { draft: parsed.data, usage, model: modelId };
  } catch (err) {
    if (err instanceof ParseTimerError) throw err;
    if (isTimeoutError(err, timedOut)) {
      throw new ParseTimerError(
        "AI request timed out. Please try again or switch model (gemini-flash-latest works best).",
        "AI_TIMEOUT",
        504,
      );
    }
    throw providerErrorToParseError(err);
  }
}

/**
 * Try primary + fallback models when free-tier quota / timeout / unavailable.
 */
async function callModelWithFallback(
  prompt: string,
  nowMs: number,
  repairHint?: string,
  preferredModel?: string,
): Promise<{
  draft: TimerDraft;
  usage: ParseTimerResult["usage"];
  model: string;
}> {
  const candidates = modelCandidates(preferredModel?.trim() || AI_PARSE_MODEL);
  let lastError: ParseTimerError | null = null;

  for (const modelId of candidates) {
    try {
      return await callModel(prompt, nowMs, repairHint, modelId);
    } catch (err) {
      if (isRetriableWithFallback(err)) {
        const code =
          err instanceof ParseTimerError ? err.code : "AI_PROVIDER_ERROR";
        lastError =
          err instanceof ParseTimerError ? err : providerErrorToParseError(err);
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
  preferredModel?: string,
): Promise<{
  draft: TimerDraft;
  usage: ParseTimerResult["usage"];
  model: string;
}> {
  let { draft, usage, model } = await callModelWithFallback(
    prompt,
    nowMs,
    undefined,
    preferredModel,
  );
  draft = sanitizeDraft(draft, nowMs);

  let validationError = await validationErrorMessage(draft);
  if (validationError) {
    const repaired = await callModelWithFallback(
      prompt,
      nowMs,
      validationError,
      preferredModel,
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
  opts: { nowMs?: number; model?: string } = {},
): Promise<ParseTimerResult> {
  const nowMs = opts.nowMs ?? Date.now();
  const preferredModel = opts.model?.trim() || AI_PARSE_MODEL;
  const started = Date.now();
  const cacheKey = hashParsePrompt(
    `${preferredModel}|${prompt}`,
    nowBucket(nowMs),
  );

  const { entry, cached } = await getOrRunCachedParse(cacheKey, () =>
    produceValidatedDraft(prompt, nowMs, preferredModel),
  );

  return {
    draft: entry.draft,
    usage: entry.usage,
    cached,
    latencyMs: Date.now() - started,
    model: entry.model,
  };
}

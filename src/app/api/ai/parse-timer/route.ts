import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/middleware";
import {
  PARSE_TIMER_MAX_PROMPT_CHARS,
  PARSE_TIMER_MIN_PROMPT_CHARS,
  draftToCreatePayload,
} from "@/lib/ai/schema";
import {
  ParseTimerError,
  isAiConfigured,
  parseTimerFromPrompt,
} from "@/lib/ai/parse-timer";
import { consumeAiRateLimit } from "@/lib/ai/rate-limit";
import { logAiUsage } from "@/lib/ai/usage";
import {
  AI_API_KEY_ENV,
  AI_BLOCKED_MODEL_IDS,
  AI_MODEL_ENV,
  AI_PARSE_MODEL_DEFAULT,
} from "@/lib/ai/constants";
import { getCachedParse, hashParsePrompt, nowBucket } from "@/lib/ai/cache";
import { isAllowedModelId, listGeminiModels } from "@/lib/ai/list-models";

export const runtime = "nodejs";

function resolveRoutePreferredModel(id: string): string {
  const trimmed = id.trim();
  if (
    !trimmed ||
    (AI_BLOCKED_MODEL_IDS as readonly string[]).includes(trimmed)
  ) {
    return AI_PARSE_MODEL_DEFAULT;
  }
  return trimmed;
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  if (!isAiConfigured()) {
    return NextResponse.json(
      {
        error: `AI timer creation is not configured. Add ${AI_API_KEY_ENV} to the server environment.`,
        code: "AI_NOT_CONFIGURED",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const prompt =
    typeof body === "object" &&
    body !== null &&
    "prompt" in body &&
    typeof (body as { prompt: unknown }).prompt === "string"
      ? (body as { prompt: string }).prompt.trim()
      : "";

  const requestedModel =
    typeof body === "object" &&
    body !== null &&
    "model" in body &&
    typeof (body as { model: unknown }).model === "string"
      ? (body as { model: string }).model.trim()
      : "";

  if (prompt.length < PARSE_TIMER_MIN_PROMPT_CHARS) {
    return NextResponse.json(
      {
        error: `Description must be at least ${PARSE_TIMER_MIN_PROMPT_CHARS} characters.`,
      },
      { status: 400 },
    );
  }

  if (prompt.length > PARSE_TIMER_MAX_PROMPT_CHARS) {
    return NextResponse.json(
      {
        error: `Description must be ${PARSE_TIMER_MAX_PROMPT_CHARS} characters or fewer.`,
      },
      { status: 400 },
    );
  }

  let preferredModel = resolveRoutePreferredModel(
    process.env[AI_MODEL_ENV]?.trim() || AI_PARSE_MODEL_DEFAULT,
  );

  if (requestedModel) {
    try {
      const catalog = await listGeminiModels();
      if (!isAllowedModelId(requestedModel, catalog)) {
        // Fall back silently if client still has a stale/blocked model id
        preferredModel = AI_PARSE_MODEL_DEFAULT;
      } else {
        preferredModel = requestedModel;
      }
    } catch {
      preferredModel =
        requestedModel === "gemini-2.5-flash" ||
        requestedModel === "gemini-3-flash"
          ? AI_PARSE_MODEL_DEFAULT
          : requestedModel;
    }
  }

  // Cached hits do not consume rate-limit quota (still auth-gated).
  const nowMs = Date.now();
  const cacheKey = hashParsePrompt(
    `${preferredModel}|${prompt}`,
    nowBucket(nowMs),
  );
  const cacheHit = getCachedParse(cacheKey);

  if (!cacheHit) {
    const rate = consumeAiRateLimit(auth.userId);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: "Too many AI requests. Please try again later.",
          code: "RATE_LIMITED",
          retryAfterSeconds: rate.retryAfterSeconds,
        },
        {
          status: 429,
          headers: { "Retry-After": String(rate.retryAfterSeconds) },
        },
      );
    }
  }

  try {
    const result = await parseTimerFromPrompt(prompt, {
      nowMs,
      model: preferredModel,
    });
    await logAiUsage({
      userId: auth.userId,
      feature: "parse-timer",
      model: result.model,
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
      totalTokens: result.usage.totalTokens,
      latencyMs: result.latencyMs,
      success: true,
      cached: result.cached,
    });

    return NextResponse.json(
      {
        draft: result.draft,
        payload: draftToCreatePayload(result.draft),
        assumptions: result.draft.assumptions,
        confidence: result.draft.confidence,
        meta: {
          cached: result.cached,
          latencyMs: result.latencyMs,
          model: result.model,
          usage: result.usage,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    const parseErr =
      err instanceof ParseTimerError
        ? err
        : new ParseTimerError(
            err instanceof Error ? err.message : "Failed to parse timer.",
            "AI_UNKNOWN",
            502,
          );

    await logAiUsage({
      userId: auth.userId,
      feature: "parse-timer",
      model: preferredModel,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      latencyMs: 0,
      success: false,
      errorCode: parseErr.code,
    });

    return NextResponse.json(
      { error: parseErr.message, code: parseErr.code },
      { status: parseErr.status },
    );
  }
}

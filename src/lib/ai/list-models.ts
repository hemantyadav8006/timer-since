/**
 * List Gemini models available to the configured API key
 * (same endpoint as: GET /v1beta/models?key=...).
 */

import "server-only";

import {
  AI_API_KEY_ENV,
  AI_PARSE_MODEL_DEFAULT,
  AI_BLOCKED_MODEL_IDS,
} from "@/lib/ai/constants";
import type { GeminiModelInfo } from "@/types/ai";

export type { GeminiModelInfo };

type GoogleModel = {
  name?: string;
  displayName?: string;
  description?: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  supportedGenerationMethods?: string[];
};

type GoogleModelsResponse = {
  models?: GoogleModel[];
  error?: { message?: string };
};

const MODELS_CACHE_TTL_MS = 10 * 60 * 1000;
let modelsCache: { expiresAt: number; models: GeminiModelInfo[] } | null = null;

function stripModelsPrefix(name: string): string {
  return name.startsWith("models/") ? name.slice("models/".length) : name;
}

/** Prefer text chat/generation Flash models; drop image/TTS/robotics clutter. */
function isUsefulTimerModel(id: string): boolean {
  const lower = id.toLowerCase();
  if (
    lower.includes("image") ||
    lower.includes("tts") ||
    lower.includes("robotics") ||
    lower.includes("lyria") ||
    lower.includes("deep-research") ||
    lower.includes("computer-use") ||
    lower.includes("embedding") ||
    lower.includes("aqa") ||
    lower.includes("nano-banana") ||
    lower.includes("antigravity")
  ) {
    return false;
  }
  return (
    lower.includes("flash") ||
    lower.includes("gemini-pro") ||
    lower.includes("gemma") ||
    lower.endsWith("-latest")
  );
}

function sortModels(models: GeminiModelInfo[]): GeminiModelInfo[] {
  const preferred = [
    AI_PARSE_MODEL_DEFAULT,
    "gemini-3.5-flash",
    "gemini-3-flash-preview",
    "gemini-3.1-flash-lite",
    "gemini-2.0-flash",
  ];
  return [...models].sort((a, b) => {
    const ai = preferred.indexOf(a.id);
    const bi = preferred.indexOf(b.id);
    if (ai !== -1 || bi !== -1) {
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    }
    return a.id.localeCompare(b.id);
  });
}

export async function listGeminiModels(opts?: {
  forceRefresh?: boolean;
}): Promise<GeminiModelInfo[]> {
  const apiKey = process.env[AI_API_KEY_ENV]?.trim();
  if (!apiKey) {
    throw new Error(
      `AI is not configured. Add ${AI_API_KEY_ENV} to the server environment.`,
    );
  }

  if (
    !opts?.forceRefresh &&
    modelsCache &&
    modelsCache.expiresAt > Date.now()
  ) {
    return modelsCache.models;
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
    { cache: "no-store" },
  );

  let data: GoogleModelsResponse;
  try {
    data = (await res.json()) as GoogleModelsResponse;
  } catch {
    throw new Error("Failed to parse Gemini models response.");
  }

  if (!res.ok) {
    throw new Error(
      data.error?.message ?? `Failed to list Gemini models (${res.status}).`,
    );
  }

  const models = sortModels(
    (data.models ?? [])
      .filter((m) =>
        (m.supportedGenerationMethods ?? []).includes("generateContent"),
      )
      .map((m) => {
        const id = stripModelsPrefix(m.name ?? "");
        return {
          id,
          displayName: m.displayName || id,
          description: m.description,
          inputTokenLimit: m.inputTokenLimit,
          outputTokenLimit: m.outputTokenLimit,
        };
      })
      .filter((m) => m.id && isUsefulTimerModel(m.id))
      .filter(
        (m) => !(AI_BLOCKED_MODEL_IDS as readonly string[]).includes(m.id),
      ),
  );

  modelsCache = {
    expiresAt: Date.now() + MODELS_CACHE_TTL_MS,
    models,
  };

  return models;
}

export function isAllowedModelId(
  modelId: string,
  catalog: GeminiModelInfo[],
): boolean {
  return catalog.some((m) => m.id === modelId);
}

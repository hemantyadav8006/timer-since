import type { CreateTimerPayload } from "@/types/timer";
import type { TimerDraft } from "@/lib/ai/schema";
import type { GeminiModelInfo } from "@/types/ai";
import { apiGet, apiPost } from "@/lib/api/helpers";

export type ParseTimerResponse = {
  draft: TimerDraft;
  payload: CreateTimerPayload;
  assumptions: string[];
  confidence: "high" | "medium" | "low";
  meta: {
    cached: boolean;
    latencyMs: number;
    model: string;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
};

export type AiModelsResponse = {
  defaultModel: string;
  models: GeminiModelInfo[];
};

export type AiUsageResponse = {
  note: string;
  appRateLimit: {
    maxRequestsPerHour: number;
    requestsLastHour: number;
    tokensLastHour: number;
  };
  allTime: {
    requests: number;
    successes: number;
    failures: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
  };
  today: {
    requests: number;
    successes: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  byModel: { model: string; requests: number; totalTokens: number }[];
  recent: {
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    success: boolean;
    latencyMs: number;
    cached: boolean;
    errorCode: string | null;
    createdAt?: string | Date;
  }[];
};

export async function parseTimerPrompt(
  prompt: string,
  model?: string,
): Promise<ParseTimerResponse> {
  return apiPost<ParseTimerResponse>("/api/ai/parse-timer", {
    prompt,
    ...(model ? { model } : {}),
  });
}

export async function fetchAiModels(): Promise<AiModelsResponse> {
  return apiGet<AiModelsResponse>("/api/ai/models");
}

export async function fetchAiUsage(): Promise<AiUsageResponse> {
  return apiGet<AiUsageResponse>("/api/ai/usage");
}

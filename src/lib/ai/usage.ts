import "server-only";

import connectMongo from "@/lib/mongodb";
import { AiUsage } from "@/models/AiUsage";

/** Approximate Gemini 2.0 Flash paid rates (USD per 1M tokens). Free tier is $0 within quota. */
const PRICE_INPUT_PER_M = 0.1;
const PRICE_OUTPUT_PER_M = 0.4;

export function estimateCostUsd(
  promptTokens: number,
  completionTokens: number,
): number {
  return (
    (promptTokens / 1_000_000) * PRICE_INPUT_PER_M +
    (completionTokens / 1_000_000) * PRICE_OUTPUT_PER_M
  );
}

export type LogAiUsageInput = {
  userId: string;
  feature: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  success: boolean;
  errorCode?: string | null;
  cached?: boolean;
};

export async function logAiUsage(input: LogAiUsageInput): Promise<void> {
  const estimatedCostUsd = estimateCostUsd(
    input.promptTokens,
    input.completionTokens,
  );

  console.info("[ai-usage]", {
    userId: input.userId,
    feature: input.feature,
    model: input.model,
    promptTokens: input.promptTokens,
    completionTokens: input.completionTokens,
    totalTokens: input.totalTokens,
    estimatedCostUsd,
    latencyMs: input.latencyMs,
    success: input.success,
    errorCode: input.errorCode ?? null,
    cached: input.cached ?? false,
  });

  try {
    await connectMongo();
    await AiUsage.create({
      ...input,
      estimatedCostUsd,
      errorCode: input.errorCode ?? null,
      cached: input.cached ?? false,
    });
  } catch (err) {
    console.warn("[ai-usage] failed to persist", err);
  }
}

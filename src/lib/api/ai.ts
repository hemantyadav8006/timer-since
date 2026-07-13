import type { CreateTimerPayload } from "@/types/timer";
import type { TimerDraft } from "@/lib/ai/schema";
import { apiPost } from "@/lib/api/helpers";

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

export async function parseTimerPrompt(
  prompt: string,
): Promise<ParseTimerResponse> {
  return apiPost<ParseTimerResponse>("/api/ai/parse-timer", { prompt });
}

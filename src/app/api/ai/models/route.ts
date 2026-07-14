import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/middleware";
import { isAiConfigured } from "@/lib/ai/parse-timer";
import { listGeminiModels } from "@/lib/ai/list-models";
import { AI_API_KEY_ENV, AI_PARSE_MODEL_DEFAULT } from "@/lib/ai/constants";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  if (!isAiConfigured()) {
    return NextResponse.json(
      {
        error: `AI is not configured. Add ${AI_API_KEY_ENV} to the server environment.`,
        code: "AI_NOT_CONFIGURED",
      },
      { status: 503 },
    );
  }

  try {
    const models = await listGeminiModels();
    return NextResponse.json(
      {
        defaultModel: AI_PARSE_MODEL_DEFAULT,
        models,
      },
      { status: 200 },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to list models.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

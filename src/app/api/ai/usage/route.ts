import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/middleware";
import connectMongo from "@/lib/mongodb";
import { AiUsage } from "@/models/AiUsage";
import { AI_PARSE_MAX_PER_HOUR } from "@/lib/ai/constants";

export const runtime = "nodejs";

function startOfUtcDay(d = new Date()): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  try {
    await connectMongo();
    const userId = auth.userId;
    const now = new Date();
    const dayStart = startOfUtcDay(now);
    const hourStart = new Date(now.getTime() - 60 * 60 * 1000);

    const [allTime, today, lastHour, recent, byModel] = await Promise.all([
      AiUsage.aggregate<{
        requests: number;
        successes: number;
        failures: number;
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
        estimatedCostUsd: number;
      }>([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            requests: { $sum: 1 },
            successes: {
              $sum: { $cond: ["$success", 1, 0] },
            },
            failures: {
              $sum: { $cond: ["$success", 0, 1] },
            },
            promptTokens: { $sum: "$promptTokens" },
            completionTokens: { $sum: "$completionTokens" },
            totalTokens: { $sum: "$totalTokens" },
            estimatedCostUsd: { $sum: "$estimatedCostUsd" },
          },
        },
      ]),
      AiUsage.aggregate([
        { $match: { userId, createdAt: { $gte: dayStart } } },
        {
          $group: {
            _id: null,
            requests: { $sum: 1 },
            successes: { $sum: { $cond: ["$success", 1, 0] } },
            promptTokens: { $sum: "$promptTokens" },
            completionTokens: { $sum: "$completionTokens" },
            totalTokens: { $sum: "$totalTokens" },
          },
        },
      ]),
      AiUsage.aggregate([
        { $match: { userId, createdAt: { $gte: hourStart } } },
        {
          $group: {
            _id: null,
            requests: { $sum: 1 },
            totalTokens: { $sum: "$totalTokens" },
          },
        },
      ]),
      AiUsage.find({ userId })
        .sort({ createdAt: -1 })
        .limit(8)
        .select(
          "model promptTokens completionTokens totalTokens success latencyMs cached errorCode createdAt",
        )
        .lean(),
      AiUsage.aggregate([
        { $match: { userId, success: true } },
        {
          $group: {
            _id: "$model",
            requests: { $sum: 1 },
            totalTokens: { $sum: "$totalTokens" },
          },
        },
        { $sort: { totalTokens: -1 } },
        { $limit: 8 },
      ]),
    ]);

    const totals = allTime[0] ?? {
      requests: 0,
      successes: 0,
      failures: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCostUsd: 0,
    };

    const todayRow = today[0] ?? {
      requests: 0,
      successes: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };

    const hourRow = lastHour[0] ?? { requests: 0, totalTokens: 0 };

    return NextResponse.json(
      {
        note: "Gemini free tier does not expose remaining tokens. These are app-tracked usage totals from your AI requests.",
        appRateLimit: {
          maxRequestsPerHour: AI_PARSE_MAX_PER_HOUR,
          requestsLastHour: hourRow.requests ?? 0,
          tokensLastHour: hourRow.totalTokens ?? 0,
        },
        allTime: {
          requests: totals.requests,
          successes: totals.successes,
          failures: totals.failures,
          promptTokens: totals.promptTokens,
          completionTokens: totals.completionTokens,
          totalTokens: totals.totalTokens,
          estimatedCostUsd: Number(
            (typeof totals.estimatedCostUsd === "number"
              ? totals.estimatedCostUsd
              : 0
            ).toFixed(6),
          ),
        },
        today: {
          requests: todayRow.requests,
          successes: todayRow.successes,
          promptTokens: todayRow.promptTokens,
          completionTokens: todayRow.completionTokens,
          totalTokens: todayRow.totalTokens,
        },
        byModel: byModel.map((row) => ({
          model: row._id as string,
          requests: row.requests as number,
          totalTokens: row.totalTokens as number,
        })),
        recent: recent.map((r) => ({
          model: r.model,
          promptTokens: r.promptTokens,
          completionTokens: r.completionTokens,
          totalTokens: r.totalTokens,
          success: r.success,
          latencyMs: r.latencyMs,
          cached: r.cached ?? false,
          errorCode: r.errorCode ?? null,
          createdAt: r.createdAt,
        })),
      },
      { status: 200 },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load AI usage.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

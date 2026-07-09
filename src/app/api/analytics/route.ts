import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import { Timer } from "@/models/Timer";
import { Entry } from "@/models/Entry";
import { requireAuth } from "@/lib/api/middleware";

export async function GET() {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    await connectMongo();
    const filter = { userId: auth.userId };

    const timers = await Timer.find(filter).lean();
    const now = Date.now();

    const total = timers.length;
    const elapsed = timers.filter((t) => t.mode === "elapsed").length;
    const countdown = timers.filter((t) => t.mode === "countdown").length;
    const archived = timers.filter((t) => t.archived).length;
    const active = timers.filter((t) => !t.archived && !t.stopped).length;
    const favorites = timers.filter((t) => t.favorite).length;

    const ages = timers
      .filter((t) => !t.archived)
      .map((t) => now - t.startDate);
    const avgAge = ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;
    const longestAge = ages.length > 0 ? Math.max(...ages) : 0;

    const upcomingCountdowns = timers
      .filter((t) => t.mode === "countdown" && !t.archived && (t.targetDate ?? t.startDate) > now)
      .sort((a, b) => (a.targetDate ?? a.startDate) - (b.targetDate ?? b.startDate))
      .slice(0, 5)
      .map((t) => ({
        _id: t._id,
        title: t.title,
        icon: t.icon,
        targetDate: t.targetDate ?? t.startDate,
        remaining: (t.targetDate ?? t.startDate) - now,
      }));

    const completedCountdowns = timers.filter(
      (t) => t.mode === "countdown" && (t.targetDate ?? t.startDate) <= now,
    ).length;

    // Category distribution
    const categoryMap: Record<string, number> = {};
    for (const t of timers) {
      categoryMap[t.category] = (categoryMap[t.category] ?? 0) + 1;
    }
    const categoryDistribution = Object.entries(categoryMap)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // Tag distribution
    const tagMap: Record<string, number> = {};
    for (const t of timers) {
      for (const tag of t.tags) {
        tagMap[tag] = (tagMap[tag] ?? 0) + 1;
      }
    }
    const tagDistribution = Object.entries(tagMap)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Creation trend (last 12 months)
    const creationTrend: { month: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
      const count = timers.filter((t) => {
        const ct = t.createdAt ? new Date(t.createdAt).getTime() : t.startDate;
        return ct >= start && ct < end;
      }).length;
      creationTrend.push({ month: label, count });
    }

    // Streaks
    let longestStreak = 0;
    for (const t of timers) {
      for (const s of t.streaks) {
        if (s.duration > longestStreak) longestStreak = s.duration;
      }
      if (!t.archived && !t.stopped) {
        const current = now - t.startDate;
        if (current > longestStreak) longestStreak = current;
      }
    }

    // Journal activity
    const timerIds = timers.map((t) => t._id.toString());
    const entryFilter = timerIds.length > 0 ? { timerId: { $in: timerIds } } : {};
    const totalEntries = await Entry.countDocuments(entryFilter);
    const recentEntries = await Entry.find(entryFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Activity heatmap (last 365 days)
    const heatmap: { date: string; count: number }[] = [];
    for (let i = 364; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayStart = new Date(dateStr).getTime();
      const dayEnd = dayStart + 86_400_000;
      const count = timers.filter((t) => {
        const ct = t.createdAt ? new Date(t.createdAt).getTime() : t.startDate;
        return ct >= dayStart && ct < dayEnd;
      }).length;
      heatmap.push({ date: dateStr, count });
    }

    return NextResponse.json({
      total,
      elapsed,
      countdown,
      archived,
      active,
      favorites,
      avgAge,
      longestAge,
      upcomingCountdowns,
      completedCountdowns,
      categoryDistribution,
      tagDistribution,
      creationTrend,
      longestStreak,
      totalEntries,
      recentEntries,
      heatmap,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate analytics." },
      { status: 500 },
    );
  }
}

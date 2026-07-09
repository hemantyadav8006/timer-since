import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import { Timer } from "@/models/Timer";
import { generateShareId } from "@/lib/utils";
import { escapeRegex } from "@/lib/utils";
import { requireAuth } from "@/lib/api/middleware";
import { validateTimerFields } from "@/lib/api/timer-validation";

const ALLOWED_SORT: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  alphabetical: { title: 1 },
  "recently-updated": { updatedAt: -1 },
  "favorites-first": { favorite: -1, createdAt: -1 },
  "pinned-first": { pinned: -1, createdAt: -1 },
};

function buildSort(sort: string): Record<string, 1 | -1> {
  const base = ALLOWED_SORT[sort] ?? ALLOWED_SORT.newest;
  if (sort === "pinned-first" || sort === "favorites-first") return base;
  return { pinned: -1, ...base };
}

export async function GET(req: Request) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const { searchParams } = new URL(req.url);
    const archived = searchParams.get("archived") === "true";
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const favorite = searchParams.get("favorite");
    const pinned = searchParams.get("pinned");
    const mode = searchParams.get("mode");
    const sort = searchParams.get("sort") ?? "newest";
    const search = searchParams.get("q");
    const limit = Math.min(Number(searchParams.get("limit")) || 200, 500);
    const skip = Math.max(Number(searchParams.get("skip")) || 0, 0);

    await connectMongo();
    const { userId } = auth;

    const filter: Record<string, unknown> = { archived, userId };
    if (category) filter.category = category;
    if (tag) filter.tags = tag;
    if (favorite === "true") filter.favorite = true;
    if (pinned === "true") filter.pinned = true;
    if (mode === "elapsed" || mode === "countdown") filter.mode = mode;
    if (search) {
      const safe = escapeRegex(search.trim());
      if (safe) {
        filter.$or = [
          { title: { $regex: safe, $options: "i" } },
          { description: { $regex: safe, $options: "i" } },
          { tags: { $regex: safe, $options: "i" } },
        ];
      }
    }

    const sortObj = buildSort(sort);

    const timers = await Timer.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Timer.countDocuments(filter);

    return NextResponse.json({ timers, total }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch timers." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const body = await req.json();
    const validationError = validateTimerFields(body, { isCreate: true });
    if (validationError) return validationError;

    const {
      title,
      description = "",
      icon = "⏱️",
      color = "#00FF88",
      category = "personal",
      tags = [],
      mode = "elapsed",
      startDate,
      targetDate = null,
      sound = "none",
      milestoneConfig,
    } = body;

    await connectMongo();
    const { userId } = auth;

    const timer = await Timer.create({
      title: title.trim(),
      description: (description ?? "").slice(0, 500),
      icon: (icon ?? "⏱️").slice(0, 8),
      color: color ?? "#00FF88",
      category,
      tags: Array.isArray(tags)
        ? tags
            .map((t: string) => t.trim())
            .filter(Boolean)
            .slice(0, 20)
        : [],
      mode,
      startDate: mode === "elapsed" ? startDate : (startDate ?? Date.now()),
      targetDate: mode === "countdown" ? (targetDate ?? startDate) : null,
      shareId: generateShareId(),
      isPublic: false,
      userId,
      stopped: false,
      archived: false,
      favorite: false,
      pinned: false,
      streaks: [],
      milestoneConfig: milestoneConfig ?? {
        enabled: true,
        customMilestones: [],
      },
      sound,
    });

    return NextResponse.json({ timer }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create timer." },
      { status: 500 },
    );
  }
}

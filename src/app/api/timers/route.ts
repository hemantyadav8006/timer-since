import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import { Timer } from "@/models/Timer";
import { getCurrentUserId } from "@/lib/auth";
import { generateShareId } from "@/lib/utils";

const ALLOWED_SORT: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  alphabetical: { title: 1 },
  "recently-updated": { updatedAt: -1 },
};

export async function GET(req: Request) {
  try {
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
    const userId = await getCurrentUserId();

    const filter: Record<string, unknown> = { archived };
    if (userId) filter.userId = userId;
    if (category) filter.category = category;
    if (tag) filter.tags = tag;
    if (favorite === "true") filter.favorite = true;
    if (pinned === "true") filter.pinned = true;
    if (mode === "elapsed" || mode === "countdown") filter.mode = mode;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    const sortObj = ALLOWED_SORT[sort] ?? ALLOWED_SORT.newest;

    const timers = await Timer.find(filter)
      .sort({ pinned: -1, ...sortObj })
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
    const body = await req.json();
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

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Timer title is required." },
        { status: 400 },
      );
    }
    if (title.trim().length > 120) {
      return NextResponse.json(
        { error: "Title must be 120 characters or fewer." },
        { status: 400 },
      );
    }

    if (mode === "elapsed") {
      if (typeof startDate !== "number" || !Number.isFinite(startDate)) {
        return NextResponse.json(
          { error: "Start date is required for elapsed timers." },
          { status: 400 },
        );
      }
      if (startDate > Date.now() + 60_000) {
        return NextResponse.json(
          { error: "Elapsed timer start date cannot be in the future." },
          { status: 400 },
        );
      }
    } else if (mode === "countdown") {
      const target = targetDate ?? startDate;
      if (typeof target !== "number" || !Number.isFinite(target)) {
        return NextResponse.json(
          { error: "Target date is required for countdown timers." },
          { status: 400 },
        );
      }
      if (target <= Date.now()) {
        return NextResponse.json(
          { error: "Countdown target must be in the future." },
          { status: 400 },
        );
      }
    }

    await connectMongo();
    const userId = (await getCurrentUserId()) ?? "";

    const timer = await Timer.create({
      title: title.trim(),
      description: (description ?? "").slice(0, 500),
      icon: (icon ?? "⏱️").slice(0, 8),
      color: color ?? "#00FF88",
      category,
      tags: Array.isArray(tags) ? tags.map((t: string) => t.trim()).filter(Boolean).slice(0, 20) : [],
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
      milestoneConfig: milestoneConfig ?? { enabled: true, customMilestones: [] },
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

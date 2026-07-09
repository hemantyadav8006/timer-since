import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import { Timer } from "@/models/Timer";
import { Entry } from "@/models/Entry";
import {
  pickFields,
  requireAuth,
  requireTimerOwner,
} from "@/lib/api/middleware";
import { validateTimerFields } from "@/lib/api/timer-validation";

const UPDATABLE_FIELDS = [
  "title",
  "description",
  "icon",
  "color",
  "category",
  "tags",
  "mode",
  "startDate",
  "targetDate",
  "archived",
  "favorite",
  "pinned",
  "stopped",
  "stoppedAt",
  "isPublic",
  "sound",
  "milestoneConfig",
  "streaks",
];

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const owned = await requireTimerOwner(id, auth.userId);
    if ("error" in owned) return owned.error;

    return NextResponse.json({ timer: owned.timer }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch timer." },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const owned = await requireTimerOwner(id, auth.userId);
    if ("error" in owned) return owned.error;

    const body = await req.json();
    const safe = pickFields(body, UPDATABLE_FIELDS);

    if (Object.keys(safe).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update." },
        { status: 400 },
      );
    }

    const mergedMode = (safe.mode ?? owned.timer.mode) as string;
    const validationError = validateTimerFields(
      { ...safe, mode: mergedMode },
      { isCreate: false },
    );
    if (validationError) return validationError;

    if (safe.title !== undefined) {
      safe.title = (safe.title as string).trim();
    }

    if (safe.tags !== undefined && Array.isArray(safe.tags)) {
      safe.tags = safe.tags
        .map((t: string) => (typeof t === "string" ? t.trim() : ""))
        .filter(Boolean)
        .slice(0, 20);
    }

    if (safe.streaks !== undefined) {
      if (!Array.isArray(safe.streaks)) {
        return NextResponse.json(
          { error: "Invalid streaks." },
          { status: 400 },
        );
      }
      for (const s of safe.streaks) {
        if (
          typeof s !== "object" ||
          s === null ||
          typeof s.startTime !== "number" ||
          typeof s.endTime !== "number" ||
          typeof s.duration !== "number"
        ) {
          return NextResponse.json(
            { error: "Invalid streak record." },
            { status: 400 },
          );
        }
      }
    }

    await connectMongo();
    const timer = await Timer.findByIdAndUpdate(id, safe, {
      new: true,
      runValidators: true,
    }).lean();

    if (!timer) {
      return NextResponse.json({ error: "Timer not found." }, { status: 404 });
    }

    return NextResponse.json({ timer }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to update timer." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const owned = await requireTimerOwner(id, auth.userId);
    if ("error" in owned) return owned.error;

    await connectMongo();
    await Entry.deleteMany({ timerId: id });
    const deleted = await Timer.findByIdAndDelete(id).lean();
    if (!deleted) {
      return NextResponse.json({ error: "Timer not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete timer." },
      { status: 500 },
    );
  }
}

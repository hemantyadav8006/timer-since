import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import { Timer } from "@/models/Timer";
import { pickFields } from "@/lib/api/middleware";

const UPDATABLE_FIELDS = [
  "title", "description", "icon", "color", "category", "tags",
  "mode", "startDate", "targetDate", "archived", "favorite", "pinned",
  "stopped", "stoppedAt", "isPublic", "sound", "milestoneConfig", "streaks",
];

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await connectMongo();
    const timer = await Timer.findById(id).lean();
    if (!timer) {
      return NextResponse.json({ error: "Timer not found." }, { status: 404 });
    }
    return NextResponse.json({ timer }, { status: 200 });
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
    const { id } = await params;
    const body = await req.json();
    const safe = pickFields(body, UPDATABLE_FIELDS);

    if (Object.keys(safe).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update." },
        { status: 400 },
      );
    }

    if (safe.title !== undefined) {
      if (typeof safe.title !== "string" || safe.title.trim().length === 0) {
        return NextResponse.json(
          { error: "Title cannot be empty." },
          { status: 400 },
        );
      }
      safe.title = safe.title.trim();
    }

    if (safe.tags !== undefined && Array.isArray(safe.tags)) {
      safe.tags = safe.tags
        .map((t: string) => (typeof t === "string" ? t.trim() : ""))
        .filter(Boolean)
        .slice(0, 20);
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
    const { id } = await params;
    await connectMongo();
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

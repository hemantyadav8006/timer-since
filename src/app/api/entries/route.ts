import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import { Entry } from "@/models/Entry";
import { Timer } from "@/models/Timer";
import {
  requireAuth,
  requireTimerIdOwner,
} from "@/lib/api/middleware";

type EntryPayload = {
  when?: number;
  text?: string;
  timerId?: string;
};

export async function GET(req: Request) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const { searchParams } = new URL(req.url);
    const timerId = searchParams.get("timerId");

    await connectMongo();

    if (timerId) {
      const owned = await requireTimerIdOwner(timerId, auth.userId);
      if ("error" in owned) return owned.error;

      const entries = await Entry.find({ timerId })
        .sort({ when: -1 })
        .select("_id timerId when text createdAt updatedAt")
        .lean();
      return NextResponse.json({ entries }, { status: 200 });
    }

    const userTimers = await Timer.find({ userId: auth.userId })
      .select("_id")
      .lean();
    const timerIds = userTimers.map((t) => t._id.toString());

    const entries = await Entry.find({ timerId: { $in: timerIds } })
      .sort({ when: -1 })
      .select("_id timerId when text createdAt updatedAt")
      .lean();

    return NextResponse.json({ entries }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch entries." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const body = (await req.json()) as EntryPayload;
    const when = body.when;
    const text = body.text?.trim() ?? "";
    const timerId = body.timerId ?? "";

    if (!timerId) {
      return NextResponse.json(
        { error: "Timer ID is required." },
        { status: 400 },
      );
    }

    const owned = await requireTimerIdOwner(timerId, auth.userId);
    if ("error" in owned) return owned.error;

    if (typeof when !== "number" || !Number.isFinite(when)) {
      return NextResponse.json(
        { error: "Invalid date time. Expected epoch milliseconds (number)." },
        { status: 400 },
      );
    }
    if (!text) {
      return NextResponse.json(
        { error: "Text is required." },
        { status: 400 },
      );
    }

    await connectMongo();
    const created = await Entry.create({ when, text, timerId });

    return NextResponse.json(
      {
        entry: {
          _id: created._id,
          timerId: created.timerId,
          when: created.when,
          text: created.text,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to create entry." },
      { status: 500 },
    );
  }
}

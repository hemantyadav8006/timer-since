import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import { Timer } from "@/models/Timer";

export async function GET() {
  try {
    await connectMongo();
    const doc = await Timer.findOne({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(
      {
        startTime: doc?.startTime ?? null,
        stopTimeAt: doc?.stopTimeAt ?? null,
        resumedTimeAt: doc?.resumedTimeAt ?? null,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch timer." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { startTime?: number };
    const startTime = body?.startTime;

    if (typeof startTime !== "number" || !Number.isFinite(startTime)) {
      return NextResponse.json(
        { error: "Invalid startTime. Expected epoch milliseconds (number)." },
        { status: 400 },
      );
    }

    // Prevent future dates (helps avoid negative elapsed).
    if (startTime > Date.now()) {
      return NextResponse.json(
        { error: "Start time cannot be in the future." },
        { status: 400 },
      );
    }

    await connectMongo();

    // Atomic upsert — single-row semantics with one DB roundtrip.
    await Timer.findOneAndUpdate(
      {},
      { startTime, stopTimeAt: null, resumedTimeAt: null },
      { upsert: true },
    );

    return NextResponse.json(
      { startTime, stopTimeAt: null, resumedTimeAt: null },
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to save timer." },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as {
      stopTimeAt?: number;
      resumedTimeAt?: number;
    };

    const updates: { stopTimeAt?: number; resumedTimeAt?: number } = {};

    if (body.stopTimeAt !== undefined) {
      if (typeof body.stopTimeAt !== "number" || !Number.isFinite(body.stopTimeAt)) {
        return NextResponse.json(
          { error: "Invalid stopTimeAt. Expected epoch milliseconds (number)." },
          { status: 400 },
        );
      }
      updates.stopTimeAt = body.stopTimeAt;
    }

    if (body.resumedTimeAt !== undefined) {
      if (
        typeof body.resumedTimeAt !== "number" ||
        !Number.isFinite(body.resumedTimeAt)
      ) {
        return NextResponse.json(
          {
            error: "Invalid resumedTimeAt. Expected epoch milliseconds (number).",
          },
          { status: 400 },
        );
      }
      updates.resumedTimeAt = body.resumedTimeAt;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update." },
        { status: 400 },
      );
    }

    await connectMongo();

    const doc = await Timer.findOneAndUpdate(
      {},
      { $set: updates },
      { returnDocument: "after" },
    ).lean();

    if (!doc) {
      return NextResponse.json({ error: "No timer found." }, { status: 404 });
    }

    return NextResponse.json({
      startTime: doc.startTime,
      stopTimeAt: doc.stopTimeAt ?? null,
      resumedTimeAt: doc.resumedTimeAt ?? null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update timer." },
      { status: 500 },
    );
  }
}

// Extra: Reset support for the UI.
export async function DELETE() {
  try {
    await connectMongo();
    await Timer.deleteMany({});
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to reset timer." },
      { status: 500 },
    );
  }
}

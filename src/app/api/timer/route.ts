import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import { Timer } from "@/models/Timer";

export async function GET() {
  try {
    await connectMongo();
    const doc = await Timer.findOne({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(
      { startTime: doc?.startTime ?? null },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
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
    await Timer.findOneAndUpdate({}, { startTime }, { upsert: true });

    return NextResponse.json({ startTime }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to save timer." },
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

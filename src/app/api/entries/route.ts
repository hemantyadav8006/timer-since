import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import { Entry } from "@/models/Entry";

type EntryPayload = {
  when?: number;
  text?: string;
  timerId?: string;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const timerId = searchParams.get("timerId");

    await connectMongo();
    const filter = timerId ? { timerId } : {};
    const entries = await Entry.find(filter)
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
    const body = (await req.json()) as EntryPayload;
    const when = body.when;
    const text = body.text?.trim() ?? "";
    const timerId = body.timerId ?? "";

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

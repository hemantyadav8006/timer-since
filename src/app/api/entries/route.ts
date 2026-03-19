import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import { Entry } from "@/models/Entry";

type EntryPayload = {
  when?: number;
  text?: string;
};

export async function GET() {
  try {
    await connectMongo();
    const entries = await Entry.find({})
      .sort({ when: -1 })
      .select("_id when text createdAt updatedAt")
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

    if (typeof when !== "number" || !Number.isFinite(when)) {
      return NextResponse.json(
        { error: "Invalid date time. Expected epoch milliseconds (number)." },
        { status: 400 },
      );
    }
    if (!text) {
      return NextResponse.json({ error: "Text is required." }, { status: 400 });
    }

    await connectMongo();
    const created = await Entry.create({ when, text });

    return NextResponse.json(
      {
        entry: {
          _id: created._id,
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

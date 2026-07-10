import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import { Entry } from "@/models/Entry";
import { requireAuth, requireEntryOwner } from "@/lib/api/middleware";

type EntryPayload = {
  when?: number;
  text?: string;
};

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const owned = await requireEntryOwner(id, auth.userId);
    if ("error" in owned) return owned.error;

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
    const updated = await Entry.findByIdAndUpdate(
      id,
      { when, text },
      { new: true, runValidators: true },
    )
      .select("_id when text createdAt updatedAt")
      .lean();

    if (!updated) {
      return NextResponse.json({ error: "Entry not found." }, { status: 404 });
    }

    return NextResponse.json({ entry: updated }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to update entry." },
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
    const owned = await requireEntryOwner(id, auth.userId);
    if ("error" in owned) return owned.error;

    await connectMongo();
    const deleted = await Entry.findByIdAndDelete(id).lean();
    if (!deleted) {
      return NextResponse.json({ error: "Entry not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete entry." },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import { Timer } from "@/models/Timer";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shareId: string }> },
) {
  try {
    const { shareId } = await params;
    await connectMongo();

    const timer = await Timer.findOne({ shareId, isPublic: true }).lean();
    if (!timer) {
      return NextResponse.json(
        { error: "Shared timer not found or is not public." },
        { status: 404 },
      );
    }

    return NextResponse.json({ timer }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch shared timer." },
      { status: 500 },
    );
  }
}

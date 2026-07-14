import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import { Timer } from "@/models/Timer";
import { toPublicTimerDto, type PublicTimerDto } from "@/lib/api/public-timer";

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

    return NextResponse.json(
      {
        timer: toPublicTimerDto({
          shareId: timer.shareId,
          title: timer.title,
          description: timer.description,
          icon: timer.icon,
          color: timer.color,
          category: timer.category as PublicTimerDto["category"],
          mode: timer.mode as PublicTimerDto["mode"],
          startDate: timer.startDate,
          targetDate: timer.targetDate,
          stopped: timer.stopped,
          stoppedAt: timer.stoppedAt,
          milestoneConfig: timer.milestoneConfig,
          youtubeVideoId: timer.youtubeVideoId ?? null,
          youtubeTitle: timer.youtubeTitle ?? null,
          youtubeThumbnail: timer.youtubeThumbnail ?? null,
        }),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch shared timer." },
      { status: 500 },
    );
  }
}

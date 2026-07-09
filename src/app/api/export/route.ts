import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import { Timer } from "@/models/Timer";
import { Entry } from "@/models/Entry";
import { timersToCSV } from "@/lib/utils";
import { requireAuth } from "@/lib/api/middleware";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") ?? "json";

    await connectMongo();
    const filter = { userId: auth.userId };

    const timers = await Timer.find(filter).sort({ createdAt: -1 }).lean();
    const entries = await Entry.find({
      timerId: { $in: timers.map((t) => t._id.toString()) },
    })
      .sort({ when: -1 })
      .lean();

    if (format === "csv") {
      const csv = timersToCSV(
        timers.map((t) => ({
          title: t.title,
          mode: t.mode,
          startDate: t.startDate,
          category: t.category,
          tags: t.tags,
          favorite: t.favorite,
          pinned: t.pinned,
          archived: t.archived,
          createdAt: t.createdAt?.toISOString(),
        })),
      );
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="timers-export.csv"',
        },
      });
    }

    const data = { exportedAt: new Date().toISOString(), timers, entries };

    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="timers-export.json"',
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to export data." },
      { status: 500 },
    );
  }
}

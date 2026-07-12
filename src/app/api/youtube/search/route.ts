import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/middleware";
import { searchYouTubeVideos } from "@/lib/youtube";

export async function GET(req: Request) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const apiKey = process.env.YOUTUBE_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "YouTube search is not configured. Add YOUTUBE_API_KEY to the server environment.",
        },
        { status: 503 },
      );
    }

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim().slice(0, 100);
    if (q.length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters." },
        { status: 400 },
      );
    }

    const results = await searchYouTubeVideos(q, apiKey);
    return NextResponse.json({ results }, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to search YouTube.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

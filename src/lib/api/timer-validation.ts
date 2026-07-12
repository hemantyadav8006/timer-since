import { NextResponse } from "next/server";
import type { TimerCategory, SoundName, TimerMode } from "@/types/timer";
import { CATEGORIES } from "@/types/timer";
import { YOUTUBE_VIDEO_ID_RE } from "@/lib/youtube-shared";

const VALID_CATEGORIES = new Set(CATEGORIES.map((c) => c.value));
const VALID_SOUNDS: SoundName[] = [
  "heartbeat",
  "rain",
  "bowls",
  "nature",
  "chime",
  "none",
];
const VALID_MODES: TimerMode[] = ["elapsed", "countdown"];

type TimerFields = {
  title?: unknown;
  description?: unknown;
  mode?: unknown;
  startDate?: unknown;
  targetDate?: unknown;
  category?: unknown;
  sound?: unknown;
  youtubeVideoId?: unknown;
  youtubeTitle?: unknown;
  youtubeThumbnail?: unknown;
};

export function validateTimerFields(
  fields: TimerFields,
  opts: { isCreate: boolean },
): NextResponse | null {
  if (fields.title !== undefined) {
    if (typeof fields.title !== "string" || fields.title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title cannot be empty." },
        { status: 400 },
      );
    }
    if (fields.title.trim().length > 120) {
      return NextResponse.json(
        { error: "Title must be 120 characters or fewer." },
        { status: 400 },
      );
    }
  } else if (opts.isCreate) {
    return NextResponse.json(
      { error: "Timer title is required." },
      { status: 400 },
    );
  }

  if (
    fields.category !== undefined &&
    (typeof fields.category !== "string" ||
      !VALID_CATEGORIES.has(fields.category as TimerCategory))
  ) {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }

  if (
    fields.sound !== undefined &&
    (typeof fields.sound !== "string" ||
      !VALID_SOUNDS.includes(fields.sound as SoundName))
  ) {
    return NextResponse.json({ error: "Invalid sound." }, { status: 400 });
  }

  if (fields.youtubeVideoId !== undefined && fields.youtubeVideoId !== null) {
    if (
      typeof fields.youtubeVideoId !== "string" ||
      !YOUTUBE_VIDEO_ID_RE.test(fields.youtubeVideoId)
    ) {
      return NextResponse.json(
        { error: "Invalid YouTube video id." },
        { status: 400 },
      );
    }
  }

  if (
    fields.youtubeTitle !== undefined &&
    fields.youtubeTitle !== null &&
    (typeof fields.youtubeTitle !== "string" ||
      fields.youtubeTitle.length > 200)
  ) {
    return NextResponse.json(
      { error: "YouTube title must be 200 characters or fewer." },
      { status: 400 },
    );
  }

  if (
    fields.youtubeThumbnail !== undefined &&
    fields.youtubeThumbnail !== null &&
    fields.youtubeThumbnail !== "" &&
    (typeof fields.youtubeThumbnail !== "string" ||
      fields.youtubeThumbnail.length > 500 ||
      !/^https:\/\//i.test(fields.youtubeThumbnail))
  ) {
    return NextResponse.json(
      { error: "Invalid YouTube thumbnail URL." },
      { status: 400 },
    );
  }

  if (
    fields.mode !== undefined &&
    (typeof fields.mode !== "string" ||
      !VALID_MODES.includes(fields.mode as TimerMode))
  ) {
    return NextResponse.json({ error: "Invalid timer mode." }, { status: 400 });
  }

  const mode = fields.mode as TimerMode | undefined;
  if (mode === "elapsed" || (opts.isCreate && mode !== "countdown")) {
    if (fields.startDate !== undefined) {
      if (
        typeof fields.startDate !== "number" ||
        !Number.isFinite(fields.startDate)
      ) {
        return NextResponse.json(
          { error: "Start date is required for elapsed timers." },
          { status: 400 },
        );
      }
      if (fields.startDate > Date.now() + 60_000) {
        return NextResponse.json(
          { error: "Elapsed timer start date cannot be in the future." },
          { status: 400 },
        );
      }
    }
  }

  if (mode === "countdown") {
    const target = opts.isCreate
      ? (fields.targetDate ?? fields.startDate)
      : fields.targetDate;
    if (target !== undefined && target !== null) {
      if (typeof target !== "number" || !Number.isFinite(target)) {
        return NextResponse.json(
          { error: "Target date is required for countdown timers." },
          { status: 400 },
        );
      }
      if (target <= Date.now()) {
        return NextResponse.json(
          { error: "Countdown target must be in the future." },
          { status: 400 },
        );
      }
    } else if (opts.isCreate) {
      return NextResponse.json(
        { error: "Target date is required for countdown timers." },
        { status: 400 },
      );
    }
  }

  if (
    fields.description !== undefined &&
    typeof fields.description === "string"
  ) {
    if (fields.description.length > 500) {
      return NextResponse.json(
        { error: "Description must be 500 characters or fewer." },
        { status: 400 },
      );
    }
  }

  return null;
}

export type YouTubeSearchResult = {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
};

export const YOUTUBE_VIDEO_ID_RE = /^[\w-]{11}$/;

/** Decode common HTML entities YouTube returns in titles. */
export function decodeYouTubeText(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCharCode(Number(code)),
    );
}

export function isValidYouTubeVideoId(id: unknown): id is string {
  return typeof id === "string" && YOUTUBE_VIDEO_ID_RE.test(id);
}

export function sanitizeYouTubeFields(input: {
  youtubeVideoId?: string | null;
  youtubeTitle?: string | null;
  youtubeThumbnail?: string | null;
}): {
  youtubeVideoId: string | null;
  youtubeTitle: string | null;
  youtubeThumbnail: string | null;
} {
  const rawId = input.youtubeVideoId ?? null;
  if (!isValidYouTubeVideoId(rawId)) {
    return {
      youtubeVideoId: null,
      youtubeTitle: null,
      youtubeThumbnail: null,
    };
  }

  const title =
    typeof input.youtubeTitle === "string"
      ? decodeYouTubeText(input.youtubeTitle).trim().slice(0, 200) || null
      : null;

  let thumbnail: string | null = null;
  if (
    typeof input.youtubeThumbnail === "string" &&
    /^https:\/\//i.test(input.youtubeThumbnail) &&
    input.youtubeThumbnail.length <= 500
  ) {
    thumbnail = input.youtubeThumbnail;
  }

  return {
    youtubeVideoId: rawId,
    youtubeTitle: title,
    youtubeThumbnail: thumbnail,
  };
}

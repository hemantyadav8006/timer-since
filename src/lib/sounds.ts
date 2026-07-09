import type { SoundName } from "@/types/timer";

export type SoundConfig = {
  label: string;
  src: string | null;
  icon: string;
  loop?: boolean;
};

export const SOUND_MAP: Record<SoundName, SoundConfig> = {
  heartbeat: { label: "Heartbeat", src: "/heartbeat.mp3", icon: "💓", loop: true },
  rain: { label: "Rain", src: "/rain.mp3", icon: "🌧️", loop: true },
  bowls: { label: "Singing Bowls", src: "/bowls.mp3", icon: "🔔", loop: true },
  nature: { label: "Nature", src: "/nature.mp3", icon: "🌿", loop: true },
  chime: { label: "Chime", src: "/chime.mp3", icon: "🎵", loop: true },
  none: { label: "No Sound", src: null, icon: "🔇" },
};

export function getSoundSrc(sound: SoundName): string | null {
  return SOUND_MAP[sound].src;
}

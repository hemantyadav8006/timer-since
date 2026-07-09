"use client";

import { memo, useEffect, useRef, useState } from "react";
import { formatPlayback } from "@/lib/utils";
import { SOUND_MAP } from "@/lib/sounds";
import type { SoundName } from "@/types/timer";

type SoundPickerProps = {
  sound: SoundName;
  color: string;
};

export default memo(function SoundPicker({ sound, color }: SoundPickerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const config = SOUND_MAP[sound];

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [sound]);

  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    const update = () => {
      if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying]);

  if (sound === "none" || !config.src) {
    return null;
  }

  async function togglePlayback() {
    const el = audioRef.current;
    if (!el) return;
    try {
      if (el.paused) {
        await el.play();
        setIsPlaying(true);
      } else {
        el.pause();
        setIsPlaying(false);
      }
    } catch {
      /* blocked by browser */
    }
  }

  const fill = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="space-y-2">
      <audio
        ref={audioRef}
        src={config.src}
        loop={config.loop}
        preload="metadata"
        onLoadedMetadata={(e) =>
          setDuration((e.target as HTMLAudioElement).duration)
        }
        onEnded={() => setIsPlaying(false)}
      />
      <button
        type="button"
        onClick={togglePlayback}
        className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition hover:bg-app-surface-strong"
        style={{ borderColor: `${color}35`, color }}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        <span
          className={`h-2 w-2 rounded-full ${isPlaying ? "shadow-[0_0_8px]" : "opacity-40"}`}
          style={{
            backgroundColor: isPlaying ? color : "currentColor",
            boxShadow: isPlaying ? `0 0 8px ${color}` : undefined,
          }}
        />
        {config.icon} {isPlaying ? "Pause" : "Play"} {config.label}
      </button>
      {duration > 0 && (
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={currentTime}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (audioRef.current) audioRef.current.currentTime = v;
              setCurrentTime(v);
            }}
            className="flex-1 cursor-pointer"
            style={{
              color,
              background: `linear-gradient(to right, ${color} ${fill}%, #333 ${fill}%)`,
            }}
            aria-label="Seek"
          />
          <span className="text-[10px] text-app-muted">
            {formatPlayback(currentTime)}/{formatPlayback(duration)}
          </span>
        </div>
      )}
    </div>
  );
});

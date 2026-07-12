"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/app/providers/ThemeProvider";
import { updateTimer } from "@/lib/api/timers";
import { toDatetimeLocalValue, isValidDatetimeLocal } from "@/lib/utils";
import {
  CATEGORIES,
  type TimerItem,
  type TimerCategory,
  type SoundName,
  type UpdateTimerPayload,
} from "@/types/timer";
import ModalBackdrop from "@/components/ui/ModalBackdrop";
import ErrorBanner from "@/components/ui/ErrorBanner";
import YouTubeTrackPicker, {
  type YouTubeTrackSelection,
} from "./YouTubeTrackPicker";

const PRESET_COLORS = [
  "#00FF88",
  "#FF6B9D",
  "#38BDF8",
  "#A78BFA",
  "#FBBF24",
  "#FB923C",
  "#F472B6",
  "#34D399",
  "#818CF8",
  "#E5E5E5",
];

type EditTimerModalProps = {
  open: boolean;
  onClose: () => void;
  timer: TimerItem | null;
  onUpdated: (timer: TimerItem) => void;
};

export default function EditTimerModal({
  open,
  onClose,
  timer,
  onUpdated,
}: EditTimerModalProps) {
  const { theme } = useTheme();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [color, setColor] = useState("");
  const [category, setCategory] = useState<TimerCategory>("personal");
  const [tagsInput, setTagsInput] = useState("");
  const [dateValue, setDateValue] = useState("");
  const [sound, setSound] = useState<SoundName>("none");
  const [youtubeTrack, setYoutubeTrack] = useState<YouTubeTrackSelection>({
    youtubeVideoId: null,
    youtubeTitle: null,
    youtubeThumbnail: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!timer) return;
    setTitle(timer.title);
    setDescription(timer.description);
    setIcon(timer.icon);
    setColor(timer.color);
    setCategory(timer.category);
    setTagsInput(timer.tags.join(", "));
    setDateValue(
      toDatetimeLocalValue(
        timer.mode === "countdown"
          ? (timer.targetDate ?? timer.startDate)
          : timer.startDate,
      ),
    );
    setSound(timer.sound);
    setYoutubeTrack({
      youtubeVideoId: timer.youtubeVideoId ?? null,
      youtubeTitle: timer.youtubeTitle ?? null,
      youtubeThumbnail: timer.youtubeThumbnail ?? null,
    });
    setError(null);
  }, [timer]);

  if (!timer) return null;

  async function handleSave() {
    setError(null);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!dateValue || !isValidDatetimeLocal(dateValue)) {
      setError("Invalid date.");
      return;
    }

    const ms = Date.parse(dateValue);
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (timer!.mode === "elapsed" && ms > Date.now() + 60_000) {
      setError("Elapsed timer start date cannot be in the future.");
      return;
    }
    if (timer!.mode === "countdown" && ms <= Date.now()) {
      setError("Countdown target must be in the future.");
      return;
    }

    const updates: UpdateTimerPayload = {
      title: title.trim(),
      description: description.trim(),
      icon,
      color,
      category,
      tags,
      sound,
      youtubeVideoId: youtubeTrack.youtubeVideoId,
      youtubeTitle: youtubeTrack.youtubeTitle,
      youtubeThumbnail: youtubeTrack.youtubeThumbnail,
    };

    if (timer!.mode === "elapsed") {
      updates.startDate = ms;
    } else {
      updates.targetDate = ms;
    }

    try {
      setSaving(true);
      const updated = await updateTimer(timer!._id, updates);
      onUpdated(updated);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalBackdrop open={open} onClose={onClose}>
      <h2 className="mb-4 text-lg font-bold text-app-fg">Edit Timer</h2>
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-app-muted">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              className="w-full rounded-xl border border-app-border bg-app-input px-4 py-2.5 text-sm text-app-fg outline-none focus:border-app-fg/25"
            />
          </div>
          <div className="w-20">
            <label className="mb-1 block text-xs text-app-muted">Icon</label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              maxLength={4}
              className="w-full rounded-xl border border-app-border bg-app-input px-3 py-2.5 text-center text-lg outline-none focus:border-app-fg/25"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-app-muted">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            className="w-full rounded-xl border border-app-border bg-app-input px-4 py-2.5 text-sm text-app-fg outline-none focus:border-app-fg/25"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-app-muted">
            {timer.mode === "elapsed" ? "Start date" : "Target date"}
          </label>
          <input
            type="datetime-local"
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            className="w-full rounded-xl border border-app-border bg-app-input px-4 py-2.5 text-sm text-app-fg outline-none focus:border-app-fg/25"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-app-muted">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as TimerCategory)}
            className="w-full rounded-xl border border-app-border bg-app-input px-4 py-2.5 text-sm text-app-fg outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.icon} {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-app-muted">Tags</label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full rounded-xl border border-app-border bg-app-input px-4 py-2.5 text-sm text-app-fg outline-none focus:border-app-fg/25"
            placeholder="gym, study"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-app-muted">Color</label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-7 w-7 rounded-full border-2 transition ${color === c ? "border-app-fg scale-110" : "border-transparent"}`}
                style={{ backgroundColor: c }}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-app-muted">
            Alert / local sound
          </label>
          <select
            value={sound}
            onChange={(e) => setSound(e.target.value as SoundName)}
            className="w-full rounded-xl border border-app-border bg-app-input px-4 py-2.5 text-sm text-app-fg outline-none"
          >
            <option value="none">None</option>
            <option value="heartbeat">Heartbeat</option>
            <option value="rain">Rain</option>
            <option value="bowls">Singing Bowls</option>
            <option value="nature">Nature</option>
            <option value="chime">Chime</option>
          </select>
        </div>

        <YouTubeTrackPicker value={youtubeTrack} onChange={setYoutubeTrack} />

        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-black transition disabled:opacity-50"
            style={{
              backgroundColor: theme.primary,
              boxShadow: `0 0 20px ${theme.glow}`,
            }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-app-border px-4 py-3 text-sm text-app-muted hover:text-app-fg"
          >
            Cancel
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

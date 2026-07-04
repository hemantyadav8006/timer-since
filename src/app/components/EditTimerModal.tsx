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

    const updates: UpdateTimerPayload = {
      title: title.trim(),
      description: description.trim(),
      icon,
      color,
      category,
      tags,
      sound,
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
      <h2 className="mb-4 text-lg font-bold text-white/90">Edit Timer</h2>
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-white/50">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-sm text-white outline-none focus:border-white/25"
            />
          </div>
          <div className="w-20">
            <label className="mb-1 block text-xs text-white/50">Icon</label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              maxLength={4}
              className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2.5 text-center text-lg outline-none focus:border-white/25"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/50">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-sm text-white outline-none focus:border-white/25"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/50">
            {timer.mode === "elapsed" ? "Start date" : "Target date"}
          </label>
          <input
            type="datetime-local"
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-sm text-white outline-none focus:border-white/25"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/50">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as TimerCategory)}
            className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-sm text-white outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.icon} {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/50">Tags</label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-sm text-white outline-none focus:border-white/25"
            placeholder="gym, study"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/50">Color</label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-7 w-7 rounded-full border-2 transition ${color === c ? "border-white scale-110" : "border-transparent"}`}
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
            className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white/55 hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

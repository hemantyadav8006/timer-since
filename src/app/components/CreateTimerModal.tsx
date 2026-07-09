"use client";

import { useState } from "react";
import { useTheme } from "@/app/providers/ThemeProvider";
import { TEMPLATES } from "@/lib/templates";
import { toDatetimeLocalValue, isValidDatetimeLocal } from "@/lib/utils";
import { createTimer } from "@/lib/api/timers";
import {
  CATEGORIES,
  type TimerItem,
  type TimerCategory,
  type SoundName,
  type CreateTimerPayload,
} from "@/types/timer";
import ModalBackdrop from "@/components/ui/ModalBackdrop";
import ErrorBanner from "@/components/ui/ErrorBanner";

type CreateTimerModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (timer: TimerItem) => void;
};

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

export default function CreateTimerModal({
  open,
  onClose,
  onCreated,
}: CreateTimerModalProps) {
  const { theme } = useTheme();
  const [step, setStep] = useState<"template" | "form">("template");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("⏱️");
  const [color, setColor] = useState("#00FF88");
  const [dateValue, setDateValue] = useState("");
  const [mode, setMode] = useState<"elapsed" | "countdown">("elapsed");
  const [category, setCategory] = useState<TimerCategory>("personal");
  const [tagsInput, setTagsInput] = useState("");
  const [sound, setSound] = useState<SoundName>("none");
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  function selectTemplate(tmpl: (typeof TEMPLATES)[0]) {
    setTitle(tmpl.defaultName);
    setIcon(tmpl.icon);
    setMode(tmpl.defaultMode === "count-up" ? "elapsed" : "countdown");
    setCategory(
      [
        "health",
        "productivity",
        "relationship",
        "education",
        "lifestyle",
        "personal",
        "work",
        "custom",
      ].includes(tmpl.defaultCategory)
        ? (tmpl.defaultCategory as TimerCategory)
        : "personal",
    );
    setColor(
      {
        emerald: "#00FF88",
        rose: "#FF6B9D",
        amber: "#FBBF24",
        blue: "#38BDF8",
        purple: "#A78BFA",
        warm: "#FB923C",
      }[tmpl.defaultTheme] ?? "#00FF88",
    );
    setSound(tmpl.defaultSound);
    setStep("form");
  }

  function reset() {
    setStep("template");
    setTitle("");
    setDescription("");
    setIcon("⏱️");
    setColor("#00FF88");
    setDateValue("");
    setMode("elapsed");
    setCategory("personal");
    setTagsInput("");
    setSound("none");
    setError(null);
  }

  async function handleCreate() {
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!dateValue || !isValidDatetimeLocal(dateValue)) {
      setError("Please select a valid date & time.");
      return;
    }

    const ms = Date.parse(dateValue);
    if (mode === "elapsed" && ms > Date.now()) {
      setError("Elapsed timer cannot start in the future.");
      return;
    }
    if (mode === "countdown" && ms <= Date.now()) {
      setError("Countdown target must be in the future.");
      return;
    }

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      setIsCreating(true);
      const payload: CreateTimerPayload = {
        title: title.trim(),
        description: description.trim(),
        icon,
        color,
        category,
        tags,
        mode,
        startDate: mode === "elapsed" ? ms : Date.now(),
        targetDate: mode === "countdown" ? ms : null,
        sound,
      };
      const timer = await createTimer(payload);
      onCreated(timer);
      reset();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create timer.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <ModalBackdrop open={open} onClose={onClose}>
      {step === "template" ? (
        <>
          <h2 className="mb-4 text-lg font-bold text-app-fg">
            Choose a Template
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.name}
                type="button"
                onClick={() => selectTemplate(tmpl)}
                className="flex flex-col items-center gap-1 rounded-xl border border-app-border bg-app-surface p-3 text-center transition hover:bg-app-surface-strong"
              >
                <span className="text-2xl">{tmpl.icon}</span>
                <span className="text-xs font-medium text-app-fg">
                  {tmpl.label}
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setStep("form");
            }}
            className="mt-3 w-full rounded-xl border border-app-border py-2 text-sm text-app-muted hover:text-app-fg"
          >
            Start from scratch
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 w-full rounded-xl py-2 text-sm text-app-muted hover:text-app-muted"
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep("template")}
              className="text-app-muted hover:text-app-fg"
            >
              &larr;
            </button>
            <h2 className="text-lg font-bold text-app-fg">Create Timer</h2>
          </div>

          <div className="space-y-4">
            {/* Title + Icon */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-app-muted">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  className="w-full rounded-xl border border-app-border bg-app-input px-4 py-2.5 text-sm text-app-fg outline-none focus:border-app-fg/25"
                  placeholder="My Timer"
                />
              </div>
              <div className="w-20">
                <label className="mb-1 block text-xs text-app-muted">
                  Icon
                </label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  maxLength={4}
                  className="w-full rounded-xl border border-app-border bg-app-input px-3 py-2.5 text-center text-lg outline-none focus:border-app-fg/25"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-xs text-app-muted">
                Description (optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                className="w-full rounded-xl border border-app-border bg-app-input px-4 py-2.5 text-sm text-app-fg outline-none focus:border-app-fg/25"
                placeholder="What is this timer for?"
              />
            </div>

            {/* Mode */}
            <div>
              <label className="mb-1 block text-xs text-app-muted">Mode</label>
              <div className="flex gap-2">
                {(["elapsed", "countdown"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition ${mode === m ? "border-app-fg/25 bg-app-surface-strong text-app-fg" : "border-app-border text-app-muted hover:text-app-fg"}`}
                  >
                    {m === "elapsed" ? "Elapsed (count up)" : "Countdown"}
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="mb-1 block text-xs text-app-muted">
                {mode === "elapsed"
                  ? "Start date (past)"
                  : "Target date (future)"}
              </label>
              <input
                type="datetime-local"
                value={dateValue}
                max={
                  mode === "elapsed"
                    ? toDatetimeLocalValue(Date.now())
                    : undefined
                }
                min={
                  mode === "countdown"
                    ? toDatetimeLocalValue(Date.now())
                    : undefined
                }
                onChange={(e) => setDateValue(e.target.value)}
                className="w-full rounded-xl border border-app-border bg-app-input px-4 py-2.5 text-sm text-app-fg outline-none focus:border-app-fg/25"
              />
            </div>

            {/* Category */}
            <div>
              <label className="mb-1 block text-xs text-app-muted">
                Category
              </label>
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

            {/* Tags */}
            <div>
              <label className="mb-1 block text-xs text-app-muted">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full rounded-xl border border-app-border bg-app-input px-4 py-2.5 text-sm text-app-fg outline-none focus:border-app-fg/25"
                placeholder="gym, study, quit-smoking"
              />
            </div>

            {/* Color */}
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
                  title="Custom color"
                />
              </div>
            </div>

            {/* Sound */}
            <div>
              <label className="mb-1 block text-xs text-app-muted">Sound</label>
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

            <ErrorBanner message={error} onDismiss={() => setError(null)} />

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={handleCreate}
                disabled={isCreating}
                className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-black transition disabled:opacity-50"
                style={{
                  backgroundColor: theme.primary,
                  boxShadow: `0 0 20px ${theme.glow}`,
                }}
              >
                {isCreating ? "Creating..." : "Create Timer"}
              </button>
              <button
                type="button"
                onClick={() => {
                  reset();
                  onClose();
                }}
                className="rounded-xl border border-app-border px-4 py-3 text-sm text-app-muted hover:text-app-fg"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </ModalBackdrop>
  );
}

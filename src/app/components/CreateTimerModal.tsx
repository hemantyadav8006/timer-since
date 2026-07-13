"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/app/providers/ThemeProvider";
import { TEMPLATES } from "@/lib/templates";
import { toDatetimeLocalValue, isValidDatetimeLocal } from "@/lib/utils";
import { createTimer } from "@/lib/api/timers";
import { parseTimerPrompt } from "@/lib/api/ai";
import {
  CATEGORIES,
  type TimerItem,
  type TimerCategory,
  type SoundName,
  type CreateTimerPayload,
  type MilestoneConfig,
} from "@/types/timer";
import ModalBackdrop from "@/components/ui/ModalBackdrop";
import ErrorBanner from "@/components/ui/ErrorBanner";
import YouTubeTrackPicker, {
  type YouTubeTrackSelection,
} from "./YouTubeTrackPicker";
import { PARSE_TIMER_MAX_PROMPT_CHARS } from "@/lib/ai/constants";

type CreateTimerModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (timer: TimerItem) => void;
};

type Step = "template" | "describe" | "form";

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
  const [step, setStep] = useState<Step>("template");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("⏱️");
  const [color, setColor] = useState("#00FF88");
  const [dateValue, setDateValue] = useState("");
  const [mode, setMode] = useState<"elapsed" | "countdown">("elapsed");
  const [category, setCategory] = useState<TimerCategory>("personal");
  const [tagsInput, setTagsInput] = useState("");
  const [sound, setSound] = useState<SoundName>("none");
  const [milestoneConfig, setMilestoneConfig] = useState<MilestoneConfig>({
    enabled: true,
    customMilestones: [],
  });
  const [youtubeTrack, setYoutubeTrack] = useState<YouTubeTrackSelection>({
    youtubeVideoId: null,
    youtubeTitle: null,
    youtubeThumbnail: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [nlPrompt, setNlPrompt] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [aiAssumptions, setAiAssumptions] = useState<string[]>([]);
  const [aiConfidence, setAiConfidence] = useState<
    "high" | "medium" | "low" | null
  >(null);

  const parseRequestId = useRef(0);
  const stepRef = useRef<Step>(step);
  stepRef.current = step;

  useEffect(() => {
    if (!open) {
      // Invalidate in-flight AI responses when modal closes
      parseRequestId.current += 1;
      setIsParsing(false);
    }
  }, [open]);

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
    setMilestoneConfig({
      enabled: true,
      customMilestones: tmpl.milestones.map((m) => ({
        label: m.label,
        durationMs: m.durationMs,
        icon: m.icon,
      })),
    });
    setAiAssumptions([]);
    setAiConfidence(null);
    setDateValue("");
    setStep("form");
  }

  function reset() {
    parseRequestId.current += 1;
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
    setMilestoneConfig({ enabled: true, customMilestones: [] });
    setYoutubeTrack({
      youtubeVideoId: null,
      youtubeTitle: null,
      youtubeThumbnail: null,
    });
    setNlPrompt("");
    setAiAssumptions([]);
    setAiConfidence(null);
    setError(null);
    setIsParsing(false);
    setIsCreating(false);
  }

  function handleModeChange(next: "elapsed" | "countdown") {
    if (next === mode) return;
    setMode(next);
    // Date semantics flip — clear stale value so user re-picks intentionally
    setDateValue("");
  }

  async function handleAiParse() {
    setError(null);
    const text = nlPrompt.trim();
    if (text.length < 3) {
      setError("Describe your timer in a few words.");
      return;
    }

    const requestId = ++parseRequestId.current;
    try {
      setIsParsing(true);
      const result = await parseTimerPrompt(text);

      // Ignore stale responses (user navigated away, closed modal, or re-ran)
      if (requestId !== parseRequestId.current) return;
      if (stepRef.current !== "describe") return;

      const { payload, assumptions, confidence } = result;

      setTitle(payload.title);
      setDescription(payload.description ?? "");
      setIcon(payload.icon ?? "⏱️");
      setColor(payload.color ?? "#00FF88");
      setMode(payload.mode ?? "elapsed");
      setCategory(payload.category ?? "personal");
      setTagsInput((payload.tags ?? []).join(", "));
      setSound(payload.sound ?? "none");
      setMilestoneConfig(
        payload.milestoneConfig ?? { enabled: true, customMilestones: [] },
      );

      const dateMs =
        payload.mode === "countdown"
          ? (payload.targetDate ?? Date.now())
          : payload.startDate;
      setDateValue(toDatetimeLocalValue(dateMs));

      setAiAssumptions(assumptions ?? []);
      setAiConfidence(confidence);
      setStep("form");
    } catch (e) {
      if (requestId !== parseRequestId.current) return;
      const message =
        e instanceof Error ? e.message : "Failed to generate timer draft.";
      setError(
        message.includes("not configured")
          ? `${message} You can still use a template or start from scratch.`
          : message,
      );
    } finally {
      if (requestId === parseRequestId.current) {
        setIsParsing(false);
      }
    }
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
        youtubeVideoId: youtubeTrack.youtubeVideoId,
        youtubeTitle: youtubeTrack.youtubeTitle,
        youtubeThumbnail: youtubeTrack.youtubeThumbnail,
        milestoneConfig,
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

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <ModalBackdrop open={open} onClose={handleClose}>
      {step === "template" ? (
        <>
          <h2 className="mb-4 text-lg font-bold text-app-fg">
            Choose a Template
          </h2>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStep("describe");
            }}
            className="mb-3 w-full rounded-xl border border-app-border bg-app-surface px-4 py-3 text-left transition hover:bg-app-surface-strong"
          >
            <div className="text-sm font-semibold text-app-fg">
              Describe with AI
            </div>
            <div className="mt-0.5 text-xs text-app-muted">
              e.g. &ldquo;90 days sober since March 1, rain sound&rdquo;
            </div>
          </button>
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
            onClick={handleClose}
            className="mt-2 w-full rounded-xl py-2 text-sm text-app-muted hover:text-app-muted"
          >
            Cancel
          </button>
        </>
      ) : step === "describe" ? (
        <>
          <div className="mb-4 flex items-center gap-2">
            <button
              type="button"
              disabled={isParsing}
              onClick={() => {
                parseRequestId.current += 1;
                setIsParsing(false);
                setError(null);
                setStep("template");
              }}
              className="text-app-muted hover:text-app-fg disabled:opacity-50"
            >
              &larr;
            </button>
            <h2 className="text-lg font-bold text-app-fg">Describe your timer</h2>
          </div>
          <p className="mb-3 text-xs text-app-muted">
            AI drafts a timer you can review and edit before creating. Nothing is
            saved until you confirm.
          </p>
          <textarea
            value={nlPrompt}
            onChange={(e) =>
              setNlPrompt(e.target.value.slice(0, PARSE_TIMER_MAX_PROMPT_CHARS))
            }
            rows={5}
            maxLength={PARSE_TIMER_MAX_PROMPT_CHARS}
            disabled={isParsing}
            placeholder="I quit sugar on March 15, 2024. Track elapsed time with weekly milestones and a rain sound."
            className="w-full resize-y rounded-xl border border-app-border bg-app-input px-4 py-3 text-sm text-app-fg outline-none focus:border-app-fg/25 disabled:opacity-60"
          />
          <div className="mt-1 mb-3 text-right text-[10px] text-app-muted">
            {nlPrompt.length}/{PARSE_TIMER_MAX_PROMPT_CHARS}
          </div>
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleAiParse}
              disabled={isParsing}
              className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-black transition disabled:opacity-50"
              style={{
                backgroundColor: theme.primary,
                boxShadow: `0 0 20px ${theme.glow}`,
              }}
            >
              {isParsing ? "Generating draft..." : "Generate draft"}
            </button>
            <button
              type="button"
              onClick={() => {
                // Cancel in-flight parse so a late response cannot overwrite the form
                parseRequestId.current += 1;
                setIsParsing(false);
                setError(null);
                setStep("form");
              }}
              className="rounded-xl border border-app-border px-4 py-3 text-sm text-app-muted hover:text-app-fg"
            >
              {isParsing ? "Cancel" : "Skip"}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setStep(aiAssumptions.length || nlPrompt ? "describe" : "template")
              }
              className="text-app-muted hover:text-app-fg"
            >
              &larr;
            </button>
            <h2 className="text-lg font-bold text-app-fg">Create Timer</h2>
          </div>

          {aiAssumptions.length > 0 && (
            <div className="mb-4 rounded-xl border border-app-border bg-app-surface px-3 py-2.5">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-app-fg">
                  AI draft ready — review before creating
                </span>
                {aiConfidence && (
                  <span className="text-[10px] uppercase tracking-wide text-app-muted">
                    {aiConfidence} confidence
                  </span>
                )}
              </div>
              <ul className="list-inside list-disc space-y-0.5 text-[11px] text-app-muted">
                {aiAssumptions.map((a, i) => (
                  <li key={`${i}-${a.slice(0, 24)}`}>{a}</li>
                ))}
              </ul>
              {milestoneConfig.customMilestones.length > 0 && (
                <p className="mt-2 text-[11px] text-app-muted">
                  {milestoneConfig.customMilestones.length} milestone
                  {milestoneConfig.customMilestones.length === 1 ? "" : "s"}{" "}
                  included
                </p>
              )}
            </div>
          )}

          <div className="space-y-4">
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
                  maxLength={8}
                  className="w-full rounded-xl border border-app-border bg-app-input px-3 py-2.5 text-center text-lg outline-none focus:border-app-fg/25"
                />
              </div>
            </div>

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

            <div>
              <label className="mb-1 block text-xs text-app-muted">Mode</label>
              <div className="flex gap-2">
                {(["elapsed", "countdown"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleModeChange(m)}
                    className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition ${mode === m ? "border-app-fg/25 bg-app-surface-strong text-app-fg" : "border-app-border text-app-muted hover:text-app-fg"}`}
                  >
                    {m === "elapsed" ? "Elapsed (count up)" : "Countdown"}
                  </button>
                ))}
              </div>
            </div>

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

            <YouTubeTrackPicker
              value={youtubeTrack}
              onChange={setYoutubeTrack}
            />

            <ErrorBanner message={error} onDismiss={() => setError(null)} />

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
                onClick={handleClose}
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

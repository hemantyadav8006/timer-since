"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/app/providers/ThemeProvider";
import { TEMPLATES } from "@/lib/templates";
import { toDatetimeLocalValue, isValidDatetimeLocal } from "@/lib/utils";
import { createTimer } from "@/lib/api/timers";
import {
  parseTimerPrompt,
  fetchAiModels,
  fetchAiUsage,
  type AiUsageResponse,
} from "@/lib/api/ai";
import type { GeminiModelInfo } from "@/types/ai";
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
import {
  AI_PARSE_MODEL_DEFAULT,
  PARSE_TIMER_MAX_PROMPT_CHARS,
} from "@/lib/ai/constants";
import AiPromptBox from "@/components/ui/ai-prompt/AiPromptBox";
import { AnimatePresence, motion } from "framer-motion";

type CreateTimerModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (timer: TimerItem) => void;
};

type Step = "template" | "describe" | "form";

const AI_MODEL_STORAGE_KEY = "timer_ai_model";

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

function formatTokens(n: number): string {
  if (!Number.isFinite(n)) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

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
  const [aiModels, setAiModels] = useState<GeminiModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState(AI_PARSE_MODEL_DEFAULT);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [aiUsage, setAiUsage] = useState<AiUsageResponse | null>(null);
  const [lastParseUsage, setLastParseUsage] = useState<{
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } | null>(null);

  const parseRequestId = useRef(0);
  const stepRef = useRef<Step>(step);
  stepRef.current = step;

  useEffect(() => {
    if (!open) {
      parseRequestId.current += 1;
      setIsParsing(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || step !== "describe") return;
    let cancelled = false;

    async function loadAiMeta() {
      setModelsLoading(true);
      try {
        const stored =
          typeof window !== "undefined"
            ? localStorage.getItem(AI_MODEL_STORAGE_KEY)
            : null;
        const [modelsRes, usageRes] = await Promise.all([
          fetchAiModels(),
          fetchAiUsage().catch(() => null),
        ]);
        if (cancelled) return;
        setAiModels(modelsRes.models);
        const preferred =
          (stored &&
          !["gemini-2.5-flash", "gemini-3-flash"].includes(stored) &&
          modelsRes.models.some((m) => m.id === stored)
            ? stored
            : null) ||
          (modelsRes.models.some((m) => m.id === modelsRes.defaultModel)
            ? modelsRes.defaultModel
            : modelsRes.models[0]?.id) ||
          AI_PARSE_MODEL_DEFAULT;
        setSelectedModel(preferred);
        if (stored && ["gemini-2.5-flash", "gemini-3-flash"].includes(stored)) {
          try {
            localStorage.setItem(AI_MODEL_STORAGE_KEY, preferred);
          } catch {
            /* ignore */
          }
        }
        if (usageRes) setAiUsage(usageRes);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error
              ? e.message
              : "Could not load Gemini models. AI may be unavailable right now.",
          );
        }
      } finally {
        if (!cancelled) setModelsLoading(false);
      }
    }

    void loadAiMeta();
    return () => {
      cancelled = true;
    };
  }, [open, step]);

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
      const result = await parseTimerPrompt(text, selectedModel);

      // Ignore stale responses (user navigated away, closed modal, or re-ran)
      if (requestId !== parseRequestId.current) return;
      if (stepRef.current !== "describe") return;

      const { payload, assumptions, confidence, meta } = result;

      setLastParseUsage({
        model: meta.model,
        promptTokens: meta.usage.promptTokens,
        completionTokens: meta.usage.completionTokens,
        totalTokens: meta.usage.totalTokens,
      });
      void fetchAiUsage()
        .then((u) => {
          if (requestId === parseRequestId.current) setAiUsage(u);
        })
        .catch(() => {});

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
          <motion.button
            type="button"
            whileHover={{ scale: 1.01, y: -1 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => {
              setError(null);
              setStep("describe");
            }}
            className="relative mb-3 w-full overflow-hidden rounded-2xl border border-transparent p-px text-left"
            style={{
              backgroundImage:
                "linear-gradient(120deg, #38bdf8, #a78bfa, #22d3ee)",
            }}
          >
            <span className="flex w-full flex-col gap-0.5 rounded-[15px] bg-[color-mix(in_srgb,var(--app-modal-bg)_92%,transparent)] px-4 py-3 backdrop-blur-md">
              <span className="text-sm font-semibold text-app-fg">
                ✨ Describe with AI
              </span>
              <span className="text-xs text-app-muted">
                e.g. &ldquo;90 days sober since March 1, rain sound&rdquo;
              </span>
            </span>
          </motion.button>
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
            <div>
              <h2 className="text-lg font-bold text-app-fg">Ask AI</h2>
              <p className="text-xs text-app-muted">
                Describe a timer in plain language — review before creating
              </p>
            </div>
          </div>

          <AiPromptBox
            value={nlPrompt}
            onChange={setNlPrompt}
            isLoading={isParsing}
            disabled={modelsLoading}
            maxLength={PARSE_TIMER_MAX_PROMPT_CHARS}
            onSubmit={() => {
              void handleAiParse();
            }}
            onCancel={() => {
              parseRequestId.current += 1;
              setIsParsing(false);
              setError(null);
            }}
            footer={
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-app-muted">
                    Model
                  </label>
                  <select
                    value={selectedModel}
                    disabled={
                      isParsing || modelsLoading || aiModels.length === 0
                    }
                    onChange={(e) => {
                      const next = e.target.value;
                      setSelectedModel(next);
                      try {
                        localStorage.setItem(AI_MODEL_STORAGE_KEY, next);
                      } catch {
                        /* ignore */
                      }
                    }}
                    className="w-full rounded-xl border border-app-border bg-app-input/80 px-3 py-2.5 text-sm text-app-fg outline-none backdrop-blur-sm disabled:opacity-60"
                  >
                    {aiModels.length === 0 ? (
                      <option value={selectedModel}>
                        {modelsLoading ? "Loading models…" : selectedModel}
                      </option>
                    ) : (
                      aiModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.id}
                          {m.inputTokenLimit
                            ? ` · ctx ${formatTokens(m.inputTokenLimit)}`
                            : ""}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <AnimatePresence initial={false}>
                  {aiUsage && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="rounded-2xl border border-app-border/80 bg-app-surface/80 px-3 py-2.5 text-[11px] text-app-muted backdrop-blur-sm"
                    >
                      <div className="mb-1 font-semibold text-app-fg">
                        App-tracked AI usage
                      </div>
                      <p className="mb-2 text-[10px] leading-snug">
                        {aiUsage.note}
                      </p>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-4">
                        <div>
                          <div className="text-[10px] uppercase tracking-wide">
                            Today
                          </div>
                          <div className="text-app-fg">
                            {formatTokens(aiUsage.today.totalTokens)} tok
                          </div>
                          <div>{aiUsage.today.requests} req</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wide">
                            All time
                          </div>
                          <div className="text-app-fg">
                            {formatTokens(aiUsage.allTime.totalTokens)} tok
                          </div>
                          <div>{aiUsage.allTime.requests} req</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wide">
                            This hour
                          </div>
                          <div className="text-app-fg">
                            {aiUsage.appRateLimit.requestsLastHour}/
                            {aiUsage.appRateLimit.maxRequestsPerHour} req
                          </div>
                          <div>
                            {formatTokens(aiUsage.appRateLimit.tokensLastHour)}{" "}
                            tok
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wide">
                            Prompt / out
                          </div>
                          <div className="text-app-fg">
                            {formatTokens(aiUsage.today.promptTokens)} /{" "}
                            {formatTokens(aiUsage.today.completionTokens)}
                          </div>
                          <div>today</div>
                        </div>
                      </div>
                      {lastParseUsage && (
                        <div className="mt-2 border-t border-app-border pt-2 text-[10px]">
                          Last draft · {lastParseUsage.model}:{" "}
                          {lastParseUsage.totalTokens} tokens (
                          {lastParseUsage.promptTokens} in /{" "}
                          {lastParseUsage.completionTokens} out)
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <ErrorBanner message={error} onDismiss={() => setError(null)} />

                <button
                  type="button"
                  disabled={isParsing}
                  onClick={() => {
                    parseRequestId.current += 1;
                    setIsParsing(false);
                    setError(null);
                    setStep("form");
                  }}
                  className="w-full rounded-xl border border-app-border py-2 text-sm text-app-muted hover:text-app-fg disabled:opacity-50"
                >
                  Skip — fill manually
                </button>
              </div>
            }
          />
        </>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setStep(
                  aiAssumptions.length || nlPrompt ? "describe" : "template",
                )
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
                  {milestoneConfig.customMilestones.length === 1
                    ? ""
                    : "s"}{" "}
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

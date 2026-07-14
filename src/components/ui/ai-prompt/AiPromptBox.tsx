"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "@/app/providers/ThemeProvider";
import {
  AI_PROCESSING_MESSAGES,
  AI_PROCESSING_ROTATE_MS,
  AI_PROMPT_SUGGESTIONS,
  AI_SUGGESTION_ROTATE_MS,
} from "@/lib/ai/prompt-ui";
import { PARSE_TIMER_MAX_PROMPT_CHARS } from "@/lib/ai/constants";
import AiGlowDots, { AiRotatingText } from "./AiRotatingText";
import { aiPromptEase, aiPromptSpring } from "./variants";

export type AiPromptBoxProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  maxLength?: number;
  /** Optional footer slot (model picker, usage, errors) */
  footer?: ReactNode;
};

export default function AiPromptBox({
  value,
  onChange,
  onSubmit,
  onCancel,
  isLoading = false,
  disabled = false,
  maxLength = PARSE_TIMER_MAX_PROMPT_CHARS,
  footer,
}: AiPromptBoxProps) {
  const { reducedMotion } = useTheme();
  const inputId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [processingIndex, setProcessingIndex] = useState(0);

  const hasText = value.trim().length > 0;
  const showSuggestions = !isLoading && !hasText && !focused && !reducedMotion;
  const canSubmit = hasText && !isLoading && !disabled;

  useEffect(() => {
    if (!showSuggestions) return;
    const id = window.setInterval(() => {
      setSuggestionIndex((i) => (i + 1) % AI_PROMPT_SUGGESTIONS.length);
    }, AI_SUGGESTION_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [showSuggestions]);

  useEffect(() => {
    if (!isLoading || reducedMotion) {
      setProcessingIndex(0);
      return;
    }
    const id = window.setInterval(() => {
      setProcessingIndex((i) => (i + 1) % AI_PROCESSING_MESSAGES.length);
    }, AI_PROCESSING_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [isLoading, reducedMotion]);

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    onSubmit();
  }, [canSubmit, onSubmit]);

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function onFormSubmit(e: FormEvent) {
    e.preventDefault();
    handleSubmit();
  }

  return (
    <form onSubmit={onFormSubmit} className="w-full">
      <motion.div
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        animate={{
          scale: focused || hasText ? 1.01 : hovered ? 1.005 : 1,
        }}
        transition={aiPromptSpring}
        className="relative"
      >
        {/* Animated gradient border shell */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-px rounded-[22px] opacity-80"
          style={{
            background:
              "linear-gradient(120deg, #38bdf8, #a78bfa, #22d3ee, #818cf8, #38bdf8)",
            backgroundSize: "300% 300%",
          }}
          animate={
            reducedMotion
              ? { opacity: focused || isLoading ? 0.85 : 0.45 }
              : {
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  opacity: focused || isLoading ? 0.95 : hovered ? 0.75 : 0.5,
                  filter:
                    focused || isLoading
                      ? "blur(0px) brightness(1.1)"
                      : "blur(0px) brightness(1)",
                }
          }
          transition={
            reducedMotion
              ? { duration: 0.25 }
              : {
                  backgroundPosition: {
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear",
                  },
                  opacity: { duration: 0.3 },
                }
          }
        />

        {/* Soft outer glow */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-2 -z-10 rounded-[28px] bg-linear-to-r from-sky-400/20 via-violet-400/25 to-cyan-400/20 blur-xl"
          animate={{
            opacity: focused || isLoading ? 0.9 : hovered ? 0.55 : 0.25,
          }}
          transition={{ duration: 0.3 }}
        />

        <div
          className={`relative overflow-hidden rounded-[21px] border border-white/10 bg-[color-mix(in_srgb,var(--app-modal-bg)_72%,transparent)] shadow-[0_8px_40px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl dark:border-white/10 ${
            isLoading ? "ring-1 ring-violet-400/30" : ""
          }`}
        >
          {/* Processing shimmer line */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-x-0 top-0 z-10 h-[2px] overflow-hidden"
              >
                <motion.div
                  className="h-full w-1/3 bg-linear-to-r from-transparent via-sky-400 to-violet-400"
                  animate={
                    reducedMotion
                      ? { opacity: [0.4, 1, 0.4] }
                      : { x: ["-20%", "320%"] }
                  }
                  transition={
                    reducedMotion
                      ? { duration: 1.2, repeat: Infinity }
                      : { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative px-4 pb-3 pt-4 sm:px-5">
            <label htmlFor={inputId} className="sr-only">
              Describe your timer for AI
            </label>

            <div className="relative min-h-30">
              {/* Rotating suggestion overlay */}
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={aiPromptEase}
                    className="pointer-events-none absolute inset-0 flex items-start px-0.5 pt-0.5"
                    aria-hidden="true"
                  >
                    <span className="mr-1.5 text-sm text-app-muted/70">✨</span>
                    <AiRotatingText
                      items={AI_PROMPT_SUGGESTIONS}
                      index={suggestionIndex}
                      className="flex-1 text-sm text-app-muted/80"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Loading status overlay */}
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={aiPromptEase}
                    className="pointer-events-none absolute inset-0 z-10 flex items-start gap-2.5 bg-[color-mix(in_srgb,var(--app-modal-bg)_55%,transparent)] px-0.5 pt-1 backdrop-blur-[2px]"
                    aria-live="polite"
                  >
                    <AiGlowDots className="mt-1.5" />
                    <div className="min-w-0 flex-1">
                      <AiRotatingText
                        items={AI_PROCESSING_MESSAGES}
                        index={reducedMotion ? 0 : processingIndex}
                        slow
                        className="text-sm font-medium text-app-fg"
                      />
                      <p className="mt-1 text-[11px] text-app-muted">
                        Crafting a timer draft you can review
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <textarea
                ref={textareaRef}
                id={inputId}
                value={value}
                disabled={isLoading || disabled}
                maxLength={maxLength}
                rows={4}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
                onKeyDown={onKeyDown}
                placeholder={
                  showSuggestions
                    ? ""
                    : reducedMotion || focused || hasText
                      ? "Describe the timer you want to create…"
                      : ""
                }
                className="relative z-1 w-full resize-none bg-transparent text-sm leading-relaxed text-app-fg outline-none placeholder:text-app-muted/70 disabled:cursor-wait disabled:opacity-40"
                aria-busy={isLoading}
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 border-t border-app-border/60 pt-3">
              <div className="min-w-0 text-[10px] text-app-muted">
                <span className="hidden sm:inline">
                  Enter to generate · Shift+Enter for newline
                </span>
                <span className="sm:hidden">Enter to generate</span>
                <span className="mx-1.5 text-app-border">·</span>
                <span>
                  {value.length}/{maxLength}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isLoading && onCancel && (
                  <motion.button
                    type="button"
                    onClick={onCancel}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    className="rounded-xl border border-app-border px-3 py-2 text-xs text-app-muted hover:text-app-fg"
                  >
                    Cancel
                  </motion.button>
                )}

                <motion.button
                  type="submit"
                  disabled={!canSubmit}
                  whileHover={canSubmit ? { y: -1, scale: 1.03 } : undefined}
                  whileTap={canSubmit ? { scale: 0.94 } : undefined}
                  transition={aiPromptSpring}
                  className="relative inline-flex h-10 min-w-30 items-center justify-center overflow-hidden rounded-xl px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
                  style={{
                    backgroundImage:
                      canSubmit || isLoading
                        ? "linear-gradient(135deg, #38bdf8 0%, #8b5cf6 50%, #22d3ee 100%)"
                        : "linear-gradient(135deg, #71717a 0%, #52525b 100%)",
                    boxShadow:
                      canSubmit || isLoading
                        ? "0 8px 24px rgba(139, 92, 246, 0.35)"
                        : "none",
                  }}
                  aria-label={isLoading ? "Generating" : "Generate draft"}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {isLoading ? (
                      <motion.span
                        key="loading"
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        className="inline-flex items-center gap-2"
                      >
                        <motion.span
                          className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                          animate={
                            reducedMotion
                              ? { opacity: [0.5, 1, 0.5] }
                              : { rotate: 360 }
                          }
                          transition={
                            reducedMotion
                              ? { duration: 1, repeat: Infinity }
                              : {
                                  duration: 0.8,
                                  repeat: Infinity,
                                  ease: "linear",
                                }
                          }
                        />
                        Working
                      </motion.span>
                    ) : (
                      <motion.span
                        key="idle"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="inline-flex items-center gap-1.5"
                      >
                        Generate
                        <span aria-hidden="true">↑</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {footer && <div className="mt-3">{footer}</div>}
    </form>
  );
}

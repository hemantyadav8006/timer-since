"use client";

import {
  useRef,
  useState,
  useEffect,
  type KeyboardEvent,
  type ClipboardEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

type OtpInputProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
};

export default function OtpInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  autoFocus = true,
}: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const digits = value.padEnd(length, " ").split("").slice(0, length);

  useEffect(() => {
    if (autoFocus) inputsRef.current[0]?.focus();
  }, [autoFocus]);

  function updateAt(index: number, char: string) {
    const next = digits.map((d, i) =>
      i === index ? char : d === " " ? "" : d,
    );
    onChange(next.join("").replace(/\s/g, "").slice(0, length));
  }

  function handleChange(index: number, raw: string) {
    const char = raw.replace(/\D/g, "").slice(-1);
    if (!char) {
      updateAt(index, "");
      return;
    }
    updateAt(index, char);
    if (index < length - 1) {
      inputsRef.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index]?.trim()) {
      if (index > 0) {
        inputsRef.current[index - 1]?.focus();
        setFocusedIndex(index - 1);
        updateAt(index - 1, "");
      }
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
      setFocusedIndex(index - 1);
    }
    if (e.key === "ArrowRight" && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, length - 1);
    inputsRef.current[focusIdx]?.focus();
    setFocusedIndex(focusIdx);
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {digits.map((digit, index) => (
        <motion.div
          key={index}
          animate={{
            scale: focusedIndex === index ? 1.05 : 1,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <input
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={digit.trim()}
            disabled={disabled}
            onFocus={() => setFocusedIndex(index)}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={`h-12 w-10 rounded-xl border bg-app-input/90 text-center text-lg font-semibold text-app-fg outline-none backdrop-blur-sm transition sm:h-14 sm:w-12 sm:text-xl ${
              focusedIndex === index
                ? "border-app-fg/40 ring-2 ring-(--app-accent)/30"
                : "border-app-border"
            } disabled:opacity-50`}
            aria-label={`Digit ${index + 1}`}
          />
        </motion.div>
      ))}
      <AnimatePresence>
        {value.length === length && (
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="sr-only"
          >
            Code complete
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

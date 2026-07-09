"use client";

import { AnimatePresence, motion } from "framer-motion";

type ErrorBannerProps = {
  message: string | null;
  onDismiss: () => void;
  className?: string;
};

export default function ErrorBanner({
  message,
  onDismiss,
  className = "",
}: ErrorBannerProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          role="alert"
          initial={{ opacity: 0, height: 0, y: -8 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className={`flex items-center justify-between gap-3 overflow-hidden rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-app-danger ${className}`}
        >
          <span>{message}</span>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss error"
            className="shrink-0 text-app-danger transition hover:text-app-danger-hover"
          >
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

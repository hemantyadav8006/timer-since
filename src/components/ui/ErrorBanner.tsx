"use client";

type ErrorBannerProps = {
  message: string | null;
  onDismiss: () => void;
  className?: string;
};

/**
 * Reusable error banner with dismiss button.
 * Renders nothing when `message` is null.
 */
export default function ErrorBanner({
  message,
  onDismiss,
  className = "",
}: ErrorBannerProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={`flex items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-200 ${className}`}
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss error"
        className="shrink-0 text-red-300 transition hover:text-white"
      >
        ✕
      </button>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";

type EmptyStateProps = {
  icon: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};

/**
 * Reusable empty state placeholder with icon, text, and optional CTA.
 */
export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center gap-3 py-16 text-center"
    >
      <span className="text-5xl opacity-30">{icon}</span>
      <h3 className="text-base font-semibold text-app-muted">{title}</h3>
      {description && (
        <p className="max-w-xs text-sm text-app-muted">{description}</p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-2 rounded-xl bg-app-surface-strong px-5 py-2.5 text-sm font-medium text-app-fg transition hover:bg-app-surface-strong"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}

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
      <h3 className="text-base font-semibold text-white/60">{title}</h3>
      {description && (
        <p className="max-w-xs text-sm text-white/40">{description}</p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/15"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}

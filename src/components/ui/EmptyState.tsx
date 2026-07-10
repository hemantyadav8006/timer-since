"use client";

import { motion } from "framer-motion";
import { useTheme } from "@/app/providers/ThemeProvider";

type EmptyStateProps = {
  icon: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  const { theme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center gap-4 py-16 text-center"
    >
      <motion.span
        className="text-5xl opacity-40"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        {icon}
      </motion.span>
      <h3 className="text-base font-semibold text-app-fg">{title}</h3>
      {description && (
        <p className="max-w-xs text-sm text-app-muted">{description}</p>
      )}
      {action && (
        <motion.button
          type="button"
          onClick={action.onClick}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="mt-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-black"
          style={{
            backgroundColor: theme.primary,
            boxShadow: `0 0 20px ${theme.glow}`,
          }}
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}

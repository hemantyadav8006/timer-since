"use client";

import { motion } from "framer-motion";

type LoadingSkeletonProps = {
  count?: number;
  variant?: "grid" | "list";
};

export default function LoadingSkeleton({
  count = 8,
  variant = "grid",
}: LoadingSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === "list") {
    return (
      <div className="flex flex-col gap-2">
        {items.map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="h-16 animate-shimmer rounded-xl border border-app-border bg-app-surface"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
      {items.map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className="h-44 animate-shimmer rounded-2xl border border-app-border bg-app-surface"
        />
      ))}
    </div>
  );
}

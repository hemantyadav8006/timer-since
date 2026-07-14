"use client";

import { AnimatePresence, motion } from "framer-motion";
import { glowDotVariants } from "./variants";

export default function AiGlowDots({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 ${className}`}
      aria-hidden="true"
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          custom={i}
          variants={glowDotVariants}
          animate="animate"
          className="h-1.5 w-1.5 rounded-full bg-linear-to-r from-sky-400 via-violet-400 to-cyan-400 shadow-[0_0_8px_rgba(129,140,248,0.7)]"
        />
      ))}
    </span>
  );
}

export function AiRotatingText({
  items,
  index,
  className = "",
  slow = false,
}: {
  items: readonly string[];
  index: number;
  className?: string;
  slow?: boolean;
}) {
  const text = items[index % items.length] ?? "";
  return (
    <span className={`relative block overflow-hidden ${className}`}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={`${index}-${text}`}
          initial={{ opacity: 0, y: slow ? 8 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: slow ? -8 : -10 }}
          transition={{ duration: slow ? 0.38 : 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="block truncate"
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

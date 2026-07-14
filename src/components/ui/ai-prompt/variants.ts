import type { Transition, Variants } from "framer-motion";

export const aiPromptSpring: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 32,
};

export const aiPromptEase: Transition = {
  duration: 0.32,
  ease: [0.22, 1, 0.36, 1],
};

export const slideFadeVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const slideFadeSlowVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const glowDotVariants: Variants = {
  animate: (i: number) => ({
    opacity: [0.35, 1, 0.35],
    scale: [0.85, 1.15, 0.85],
    transition: {
      duration: 1.05,
      repeat: Infinity,
      delay: i * 0.18,
      ease: "easeInOut",
    },
  }),
};

"use client";

import { type ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ModalBackdropProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Max width class. Defaults to "max-w-lg". */
  maxWidth?: string;
};

/**
 * Reusable modal wrapper with animated backdrop, click-outside-to-close,
 * Escape key handling, and scroll lock.
 */
export default function ModalBackdrop({
  open,
  onClose,
  children,
  maxWidth = "max-w-lg",
}: ModalBackdropProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className={`max-h-[85vh] w-full overflow-y-auto rounded-2xl border border-white/10 bg-[#0a0a0a]/95 p-6 shadow-2xl backdrop-blur-md ${maxWidth}`}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

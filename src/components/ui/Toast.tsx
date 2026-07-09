"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

type ToastVariant = "success" | "error" | "info" | "undo";

type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
  action?: { label: string; onClick: () => void };
};

type ToastContextValue = {
  toast: (
    message: string,
    variant?: ToastVariant,
    action?: ToastItem["action"],
  ) => void;
};

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback(
    (
      message: string,
      variant: ToastVariant = "info",
      action?: ToastItem["action"],
    ) => {
      const id = ++nextId;
      setItems((prev) => [...prev, { id, message, variant, action }]);
      setTimeout(
        () => {
          setItems((prev) => prev.filter((t) => t.id !== id));
        },
        variant === "undo" ? 6000 : 3500,
      );
    },
    [],
  );

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const variantStyles: Record<ToastVariant, string> = {
    success:
      "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-200",
    error: "border-red-500/30 bg-red-500/15 text-app-danger",
    info: "border-app-border bg-app-surface-strong text-app-fg",
    undo: "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-200",
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-100 flex flex-col gap-2">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={`pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-md ${variantStyles[item.variant]}`}
            >
              <span className="flex-1">{item.message}</span>
              {item.action && (
                <button
                  type="button"
                  onClick={() => {
                    item.action!.onClick();
                    dismiss(item.id);
                  }}
                  className="shrink-0 font-semibold underline underline-offset-2"
                >
                  {item.action.label}
                </button>
              )}
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="shrink-0 opacity-60 hover:opacity-100"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

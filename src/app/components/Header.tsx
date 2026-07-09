"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/app/providers/AuthProvider";
import { useTheme } from "@/app/providers/ThemeProvider";
import { THEME_NAMES, THEMES } from "@/lib/themes";
import type { ThemeName, ViewMode } from "@/types/timer";

type HeaderProps = {
  onSearch: (query: string) => void;
  searchQuery: string;
};

const VIEW_MODES: { mode: ViewMode; label: string; icon: string }[] = [
  { mode: "grid", label: "Grid", icon: "▦" },
  { mode: "list", label: "List", icon: "☰" },
  { mode: "compact", label: "Compact", icon: "▤" },
];

export default function Header({ onSearch, searchQuery }: HeaderProps) {
  const { user, logout } = useAuth();
  const {
    themeName,
    setThemeName,
    theme,
    colorMode,
    toggleColorMode,
    reducedMotion,
    setReducedMotion,
    viewMode,
    setViewMode,
  } = useTheme();

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-20 flex flex-col gap-3 px-4 py-3 md:px-6 md:py-4"
    >
      <div className="flex items-center justify-between gap-3">
        <motion.h1
          className="text-base font-bold tracking-wider md:text-lg"
          style={{ color: theme.primary }}
          whileHover={{ scale: 1.02 }}
        >
          Time Since
        </motion.h1>

        <div className="flex shrink-0 items-center gap-2">
          <motion.button
            type="button"
            onClick={toggleColorMode}
            whileTap={{ scale: 0.92 }}
            title={
              colorMode === "light"
                ? "Switch to dark mode"
                : "Switch to light mode"
            }
            aria-label={
              colorMode === "light"
                ? "Switch to dark mode"
                : "Switch to light mode"
            }
            className="rounded-lg border border-app-border bg-app-surface/80 px-2.5 py-1.5 text-sm text-app-fg backdrop-blur-sm transition hover:bg-app-surface-strong"
          >
            {colorMode === "light" ? "🌙" : "☀️"}
          </motion.button>
          <motion.button
            type="button"
            onClick={logout}
            whileTap={{ scale: 0.95 }}
            className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs text-red-500 transition hover:bg-red-500 hover:text-white md:text-sm"
          >
            Log Out
          </motion.button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.08 }}
      >
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search timers... (Ctrl+K)"
          aria-label="Search timers"
          className="w-full rounded-xl border border-app-border bg-app-input/90 px-4 py-2.5 text-sm text-app-fg outline-none backdrop-blur-sm transition placeholder:text-app-muted focus:border-app-fg/25 focus:ring-2 focus:ring-(--app-accent-glow) md:py-2"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="flex items-center gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0"
      >
        <div className="flex shrink-0 overflow-hidden rounded-lg border border-app-border bg-app-surface/80 backdrop-blur-sm">
          {VIEW_MODES.map((vm) => (
            <motion.button
              key={vm.mode}
              type="button"
              onClick={() => setViewMode(vm.mode)}
              whileTap={{ scale: 0.94 }}
              title={vm.label}
              className={`px-2.5 py-1.5 text-xs transition ${
                viewMode === vm.mode
                  ? "bg-app-surface-strong text-app-fg"
                  : "text-app-muted hover:text-app-fg"
              }`}
            >
              {vm.icon}
            </motion.button>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-1 rounded-lg border border-app-border bg-app-surface/80 px-2 py-1.5 backdrop-blur-sm">
          {THEME_NAMES.map((tn) => (
            <motion.button
              key={tn}
              type="button"
              onClick={() => setThemeName(tn as ThemeName)}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              title={tn}
              className={`h-3.5 w-3.5 rounded-full border-2 transition ${
                themeName === tn
                  ? "scale-125 border-app-fg"
                  : "border-transparent opacity-70"
              }`}
              style={{ backgroundColor: THEMES[tn].primary }}
            />
          ))}
        </div>

        <motion.button
          type="button"
          onClick={() => setReducedMotion(!reducedMotion)}
          whileTap={{ scale: 0.94 }}
          title={reducedMotion ? "Enable animations" : "Reduce motion"}
          className={`shrink-0 rounded-lg border border-app-border bg-app-surface/80 px-2 py-1.5 text-[11px] backdrop-blur-sm transition ${
            reducedMotion
              ? "bg-app-surface-strong text-app-fg"
              : "text-app-muted hover:text-app-fg"
          }`}
          aria-label="Toggle reduced motion"
        >
          {reducedMotion ? "⏸" : "▶"}
        </motion.button>

        {user && (
          <span className="ml-auto hidden shrink-0 text-xs text-app-muted md:inline">
            {user.name}
          </span>
        )}
      </motion.div>
    </motion.header>
  );
}

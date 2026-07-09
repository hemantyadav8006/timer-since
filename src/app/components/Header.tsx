"use client";

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
    <header className="relative z-20 flex flex-col gap-3 px-4 py-3 md:px-6 md:py-4">
      {/* Mobile-first: logo + primary actions */}
      <div className="flex items-center justify-between gap-3">
        <h1
          className="text-base font-bold tracking-wider md:text-lg"
          style={{ color: theme.primary }}
        >
          Time Since
        </h1>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleColorMode}
            title={colorMode === "light" ? "Switch to dark mode" : "Switch to light mode"}
            aria-label={colorMode === "light" ? "Switch to dark mode" : "Switch to light mode"}
            className="rounded-lg border border-app-border px-2.5 py-1.5 text-sm text-app-fg transition hover:bg-app-surface-strong"
          >
            {colorMode === "light" ? "🌙" : "☀️"}
          </button>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs text-red-500 transition hover:bg-red-500 hover:text-app-fg md:text-sm"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Full-width search on all breakpoints */}
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search timers..."
        aria-label="Search timers"
        className="w-full rounded-xl border border-app-border bg-app-input px-4 py-2.5 text-sm text-app-fg outline-none transition placeholder:text-app-muted focus:border-app-fg/25 focus:ring-1 focus:ring-app-border md:py-2"
      />

      {/* Toolbar: scroll on mobile, wrap on desktop */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0">
        <div className="flex shrink-0 overflow-hidden rounded-lg border border-app-border">
          {VIEW_MODES.map((vm) => (
            <button
              key={vm.mode}
              type="button"
              onClick={() => setViewMode(vm.mode)}
              title={vm.label}
              className={`px-2.5 py-1.5 text-xs transition ${
                viewMode === vm.mode
                  ? "bg-app-surface-strong text-app-fg"
                  : "text-app-muted hover:text-app-fg"
              }`}
            >
              {vm.icon}
            </button>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-1 rounded-lg border border-app-border px-2 py-1.5">
          {THEME_NAMES.map((tn) => (
            <button
              key={tn}
              type="button"
              onClick={() => setThemeName(tn as ThemeName)}
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

        <button
          type="button"
          onClick={() => setReducedMotion(!reducedMotion)}
          title={reducedMotion ? "Enable animations" : "Reduce motion"}
          className={`shrink-0 rounded-lg border border-app-border px-2 py-1.5 text-[11px] transition ${
            reducedMotion
              ? "bg-app-surface-strong text-app-fg"
              : "text-app-muted hover:text-app-fg"
          }`}
          aria-label="Toggle reduced motion"
        >
          {reducedMotion ? "⏸" : "▶"}
        </button>

        {user && (
          <span className="ml-auto hidden shrink-0 text-xs text-app-muted md:inline">
            {user.name}
          </span>
        )}
      </div>
    </header>
  );
}

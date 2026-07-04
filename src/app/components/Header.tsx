"use client";

import { useAuth } from "@/app/providers/AuthProvider";
import { useTheme } from "@/app/providers/ThemeProvider";
import { THEME_NAMES, THEMES } from "@/lib/themes";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";
import type { ThemeName, ViewMode } from "@/types/timer";

type HeaderProps = {
  onAuthClick: () => void;
  onSearch: (query: string) => void;
  searchQuery: string;
};

const VIEW_MODES: { mode: ViewMode; label: string; icon: string }[] = [
  { mode: "grid", label: "Grid", icon: "▦" },
  { mode: "list", label: "List", icon: "☰" },
  { mode: "compact", label: "Compact", icon: "▤" },
];

export default function Header({
  onAuthClick,
  onSearch,
  searchQuery,
}: HeaderProps) {
  const { user, logout } = useAuth();
  const {
    themeName,
    setThemeName,
    theme,
    language,
    setLanguage,
    reducedMotion,
    setReducedMotion,
    viewMode,
    setViewMode,
  } = useTheme();

  return (
    <header className="relative z-20 flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
      {/* Logo */}
      <h1
        className="mr-auto text-lg font-bold tracking-wider"
        style={{ color: theme.primary }}
      >
        Time Since
      </h1>

      {/* Search */}
      <div className="order-last w-full sm:order-0 sm:w-auto">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search timers... (Ctrl+K)"
          aria-label="Search timers"
          className="w-full rounded-xl border border-white/10 bg-white/3 px-4 py-2 text-sm text-white/80 outline-none transition placeholder:text-white/25 focus:border-white/20 focus:bg-white/5 sm:w-64"
        />
      </div>

      {/* View mode */}
      <div className="flex overflow-hidden rounded-lg border border-white/10">
        {VIEW_MODES.map((vm) => (
          <button
            key={vm.mode}
            type="button"
            onClick={() => setViewMode(vm.mode)}
            title={vm.label}
            className={`px-2.5 py-1.5 text-xs transition ${viewMode === vm.mode ? "bg-white/12 text-white" : "text-white/40 hover:text-white/70"}`}
          >
            {vm.icon}
          </button>
        ))}
      </div>

      {/* Theme */}
      <div className="flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1.5">
        {THEME_NAMES.map((tn) => (
          <button
            key={tn}
            type="button"
            onClick={() => setThemeName(tn as ThemeName)}
            title={tn}
            className={`h-3.5 w-3.5 rounded-full border-2 transition ${themeName === tn ? "border-white scale-125" : "border-transparent opacity-70"}`}
            style={{ backgroundColor: THEMES[tn].primary }}
          />
        ))}
      </div>

      {/* Language */}
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="rounded-lg border border-white/10 bg-transparent px-2 py-1.5 text-xs text-white/60 outline-none"
        aria-label="Language"
      >
        {SUPPORTED_LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>

      {/* Reduced motion */}
      <button
        type="button"
        onClick={() => setReducedMotion(!reducedMotion)}
        title={reducedMotion ? "Enable animations" : "Reduce motion"}
        className={`rounded-lg border border-white/10 px-2 py-1.5 text-[11px] transition ${reducedMotion ? "bg-white/12 text-white" : "text-white/40"}`}
        aria-label="Toggle reduced motion"
      >
        {reducedMotion ? "⏸" : "▶"}
      </button>

      {/* Auth */}
      {user ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50">{user.name}</span>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/55 hover:text-white"
          >
            Log Out
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onAuthClick}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-black transition"
          style={{ backgroundColor: theme.primary }}
        >
          Log In
        </button>
      )}
    </header>
  );
}

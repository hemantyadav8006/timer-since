"use client";

import { CATEGORIES, type TimerCategory, type SortOption } from "@/types/timer";
import { useTheme } from "@/app/providers/ThemeProvider";

type FilterBarProps = {
  category: string;
  onCategoryChange: (c: string) => void;
  sortBy: SortOption;
  onSortChange: (s: SortOption) => void;
  showArchived: boolean;
  onToggleArchived: () => void;
  showFavorites: boolean;
  onToggleFavorites: () => void;
  modeFilter: string;
  onModeChange: (m: string) => void;
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "alphabetical", label: "A-Z" },
  { value: "recently-updated", label: "Updated" },
  { value: "favorites-first", label: "Favorites" },
  { value: "pinned-first", label: "Pinned" },
];

export default function FilterBar({
  category,
  onCategoryChange,
  sortBy,
  onSortChange,
  showArchived,
  onToggleArchived,
  showFavorites,
  onToggleFavorites,
  modeFilter,
  onModeChange,
}: FilterBarProps) {
  const { theme } = useTheme();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Category filter */}
      <select
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="rounded-lg border border-white/10 bg-transparent px-2.5 py-1.5 text-xs text-white/60 outline-none"
        aria-label="Filter by category"
      >
        <option value="">All Categories</option>
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.icon} {c.label}
          </option>
        ))}
      </select>

      {/* Mode filter */}
      <select
        value={modeFilter}
        onChange={(e) => onModeChange(e.target.value)}
        className="rounded-lg border border-white/10 bg-transparent px-2.5 py-1.5 text-xs text-white/60 outline-none"
        aria-label="Filter by mode"
      >
        <option value="">All Modes</option>
        <option value="elapsed">Elapsed</option>
        <option value="countdown">Countdown</option>
      </select>

      {/* Sort */}
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        className="rounded-lg border border-white/10 bg-transparent px-2.5 py-1.5 text-xs text-white/60 outline-none"
        aria-label="Sort by"
      >
        {SORT_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>
            Sort: {s.label}
          </option>
        ))}
      </select>

      {/* Favorites toggle */}
      <button
        type="button"
        onClick={onToggleFavorites}
        className={`rounded-lg border px-2.5 py-1.5 text-xs transition ${
          showFavorites
            ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
            : "border-white/10 text-white/40 hover:text-white/70"
        }`}
      >
        ⭐ Favorites
      </button>

      {/* Archived toggle */}
      <button
        type="button"
        onClick={onToggleArchived}
        className={`rounded-lg border px-2.5 py-1.5 text-xs transition ${
          showArchived
            ? "border-white/25 bg-white/10 text-white/80"
            : "border-white/10 text-white/40 hover:text-white/70"
        }`}
      >
        📦 Archived
      </button>
    </div>
  );
}

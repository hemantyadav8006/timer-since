"use client";

import { CATEGORIES, type SortOption } from "@/types/timer";

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

const selectClass =
  "w-full min-w-[8.5rem] rounded-lg border border-app-border bg-app-input px-2.5 py-2 text-xs text-app-fg outline-none md:py-1.5";

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
  return (
    <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center">
      <select
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
        className={selectClass}
        aria-label="Filter by category"
      >
        <option value="">All Categories</option>
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.icon} {c.label}
          </option>
        ))}
      </select>

      <select
        value={modeFilter}
        onChange={(e) => onModeChange(e.target.value)}
        className={selectClass}
        aria-label="Filter by mode"
      >
        <option value="">All Modes</option>
        <option value="elapsed">Elapsed</option>
        <option value="countdown">Countdown</option>
      </select>

      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        className={`${selectClass} col-span-2 md:col-span-1`}
        aria-label="Sort by"
      >
        {SORT_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>
            Sort: {s.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={onToggleFavorites}
        className={`rounded-lg border px-2.5 py-2 text-xs transition md:py-1.5 ${
          showFavorites
            ? "border-amber-400/30 bg-amber-400/10 text-amber-600 dark:text-amber-300"
            : "border-app-border text-app-muted hover:text-app-fg"
        }`}
      >
        ⭐ Favorites
      </button>

      <button
        type="button"
        onClick={onToggleArchived}
        className={`rounded-lg border px-2.5 py-2 text-xs transition md:py-1.5 ${
          showArchived
            ? "border-app-border bg-app-surface-strong text-app-fg"
            : "border-app-border text-app-muted hover:text-app-fg"
        }`}
      >
        📦 Archived
      </button>
    </div>
  );
}

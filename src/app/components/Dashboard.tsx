"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/app/providers/ThemeProvider";
import { useDebounce } from "@/hooks/useDebounce";
import {
  fetchTimers,
  deleteTimer,
  updateTimer,
  duplicateTimer,
} from "@/lib/api/timers";
import { isSessionExpiredError } from "@/lib/api/http";
import { useToast } from "@/components/ui/Toast";
import {
  buildResyncPayload,
  type TimerItem,
  type SortOption,
  type UpdateTimerPayload,
} from "@/types/timer";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Confetti from "@/components/ui/Confetti";
import Header from "./Header";
import FilterBar from "./FilterBar";
import TimerCard from "./TimerCard";
import TimerFocusView from "./TimerFocusView";
import CreateTimerModal from "./CreateTimerModal";
import EditTimerModal from "./EditTimerModal";
import ExportDialog from "./ExportDialog";
import ShareDialog from "./ShareDialog";
import BreathingExercise from "./BreathingExercise";
import AnalyticsDashboard from "./AnalyticsDashboard";

export default function Dashboard() {
  const { theme, viewMode } = useTheme();
  const { toast } = useToast();

  // ── Data ──────────────────────────────────────────────
  const [timers, setTimers] = useState<TimerItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // ── UI state ──────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 250);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showArchived, setShowArchived] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);

  // ── Modals ────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTimer, setEditTimer] = useState<TimerItem | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [breathingOpen, setBreathingOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareTimer, setShareTimer] = useState<TimerItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<TimerItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confetti, setConfetti] = useState<{
    active: boolean;
    color: string;
  } | null>(null);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const loadRequestRef = useRef(0);

  // ── Keyboard shortcut: Ctrl+K for search ──────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        document
          .querySelector<HTMLInputElement>('input[type="search"]')
          ?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Fetch timers ──────────────────────────────────────
  const loadTimers = useCallback(async () => {
    const requestId = ++loadRequestRef.current;
    try {
      const { timers: data, total: t } = await fetchTimers({
        archived: showArchived,
        category: categoryFilter || undefined,
        mode: modeFilter || undefined,
        favorite: showFavorites || undefined,
        sort: sortBy,
        q: debouncedSearch || undefined,
      });
      if (requestId !== loadRequestRef.current) return;
      setTimers(data);
      setTotal(t);
    } catch (err) {
      if (requestId !== loadRequestRef.current) return;
      if (!isSessionExpiredError(err)) {
        toast("Failed to load timers.", "error");
      }
    } finally {
      if (requestId === loadRequestRef.current) {
        setLoading(false);
      }
    }
  }, [
    showArchived,
    categoryFilter,
    modeFilter,
    showFavorites,
    sortBy,
    debouncedSearch,
    toast,
  ]);

  useEffect(() => {
    setLoading(true);
    loadTimers();
  }, [loadTimers]);

  // ── Derived ───────────────────────────────────────────
  const selectedTimer = useMemo(
    () => timers.find((t) => t._id === selectedId) ?? null,
    [timers, selectedId],
  );

  const stats = useMemo(() => {
    const pinned = timers.filter((t) => t.pinned);
    const favorites = timers.filter((t) => t.favorite);
    const countdowns = timers.filter(
      (t) => t.mode === "countdown" && !t.archived,
    );
    return { pinned, favorites, countdowns };
  }, [timers]);

  const triggerConfetti = useCallback((color: string) => {
    setConfetti({ active: true, color });
    window.setTimeout(() => setConfetti(null), 4000);
  }, []);

  const handleCountdownComplete = useCallback(
    (timer: TimerItem) => {
      triggerConfetti(timer.color);
    },
    [triggerConfetti],
  );

  // ── CRUD handlers ─────────────────────────────────────
  const handleCreated = useCallback(
    (timer: TimerItem) => {
      setTimers((prev) => [timer, ...prev]);
      setTotal((t) => t + 1);
      toast("Timer created!", "success");
      triggerConfetti(theme.primary);
    },
    [toast, theme.primary, triggerConfetti],
  );

  const handleUpdated = useCallback((updated: TimerItem) => {
    setTimers((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
  }, []);

  const quickUpdate = useCallback(
    async (id: string, updates: UpdateTimerPayload): Promise<boolean> => {
      try {
        const updated = await updateTimer(id, updates);
        handleUpdated(updated);
        return true;
      } catch (err) {
        if (!isSessionExpiredError(err)) {
          toast("Failed to update timer.", "error");
        }
        return false;
      }
    },
    [handleUpdated, toast],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteConfirm) return;
    const { _id, title } = deleteConfirm;
    setDeleting(true);
    try {
      await deleteTimer(_id);
      setTimers((prev) => prev.filter((t) => t._id !== _id));
      setTotal((t) => t - 1);
      if (selectedId === _id) setSelectedId(null);
      setDeleteConfirm(null);
      toast(`"${title}" deleted.`, "success");
    } catch {
      toast("Failed to delete timer.", "error");
    } finally {
      setDeleting(false);
    }
  }, [deleteConfirm, selectedId, toast]);

  const handleDuplicate = useCallback(
    async (timer: TimerItem) => {
      try {
        const dup = await duplicateTimer(timer);
        setTimers((prev) => [dup, ...prev]);
        setTotal((t) => t + 1);
        toast(`Duplicated as "${dup.title}"`, "success");
      } catch {
        toast("Failed to duplicate.", "error");
      }
    },
    [toast],
  );

  const handleArchive = useCallback(
    async (timer: TimerItem) => {
      const ok = await quickUpdate(timer._id, { archived: !timer.archived });
      if (!ok) return;
      if (!showArchived && !timer.archived) {
        setTimers((prev) => prev.filter((t) => t._id !== timer._id));
        setTotal((t) => t - 1);
      }
      toast(timer.archived ? "Timer restored!" : "Timer archived.", "info");
    },
    [quickUpdate, showArchived, toast],
  );

  const handleStop = useCallback(
    (timer: TimerItem) => {
      const now = Date.now();
      const segmentStart =
        timer.streaks.length > 0
          ? timer.streaks[timer.streaks.length - 1].endTime
          : timer.startDate;
      void quickUpdate(timer._id, {
        stopped: true,
        stoppedAt: now,
        streaks: [
          ...timer.streaks,
          {
            startTime: segmentStart,
            endTime: now,
            duration: now - segmentStart,
          },
        ],
      });
    },
    [quickUpdate],
  );

  const handleResync = useCallback(
    (timer: TimerItem) => {
      void quickUpdate(timer._id, buildResyncPayload(timer));
    },
    [quickUpdate],
  );

  // ── Focus view ────────────────────────────────────────
  if (selectedTimer) {
    return (
      <>
        <Header onSearch={setSearchQuery} searchQuery={searchQuery} />
        <TimerFocusView
          timer={selectedTimer}
          onBack={() => setSelectedId(null)}
          onStop={() => handleStop(selectedTimer)}
          onResync={() => handleResync(selectedTimer)}
          onDelete={() => setDeleteConfirm(selectedTimer)}
          onShare={() => {
            setShareTimer(selectedTimer);
            setShareOpen(true);
          }}
          onEdit={() => {
            setEditTimer(selectedTimer);
            setEditOpen(true);
          }}
          onDuplicate={() => handleDuplicate(selectedTimer)}
          onToggleFavorite={() =>
            quickUpdate(selectedTimer._id, {
              favorite: !selectedTimer.favorite,
            })
          }
          onTogglePin={() =>
            quickUpdate(selectedTimer._id, { pinned: !selectedTimer.pinned })
          }
          onArchive={() => handleArchive(selectedTimer)}
          onTimerUpdated={handleUpdated}
        />
        <EditTimerModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          timer={editTimer}
          onUpdated={handleUpdated}
        />
        <ShareDialog
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          timer={shareTimer}
          onTimerUpdated={(updated) => {
            handleUpdated(updated);
            setShareTimer(updated);
          }}
        />
        <ConfirmDialog
          open={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={handleDelete}
          title="Delete Timer?"
          description={`"${deleteConfirm?.title}" will be permanently deleted.`}
          confirmLabel="Delete"
          destructive
          loading={deleting}
        />
        <Confetti
          active={!!confetti?.active}
          color={confetti?.color ?? theme.primary}
        />
      </>
    );
  }

  // ── Dashboard view ────────────────────────────────────
  return (
    <>
      <Header onSearch={setSearchQuery} searchQuery={searchQuery} />

      <div className="relative z-10 flex-1 px-4 pb-8 md:px-6">
        {/* Quick stats bar */}
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-app-muted md:gap-3">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            key={total}
          >
            {total} timer{total !== 1 ? "s" : ""}
          </motion.span>
          {stats.pinned.length > 0 && (
            <span>📌 {stats.pinned.length} pinned</span>
          )}
          {stats.favorites.length > 0 && (
            <span>⭐ {stats.favorites.length} favorites</span>
          )}
          {stats.countdowns.length > 0 && (
            <span>⏳ {stats.countdowns.length} countdowns</span>
          )}
        </div>

        {/* Actions + Filters — mobile-first stack */}
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:flex md:flex-wrap md:gap-3">
            <motion.button
              type="button"
              onClick={() => setCreateOpen(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="col-span-2 rounded-xl px-4 py-3 text-sm font-semibold text-black transition sm:col-span-1 md:px-5 md:py-2.5"
              style={{
                backgroundColor: theme.primary,
                boxShadow: `0 0 20px ${theme.glow}`,
              }}
            >
              + Create Timer
            </motion.button>
            <motion.button
              type="button"
              onClick={() => setAnalyticsOpen(true)}
              whileTap={{ scale: 0.97 }}
              className="rounded-xl border border-app-border bg-app-surface/90 px-3 py-3 text-sm text-app-muted backdrop-blur-sm transition hover:bg-app-surface-strong hover:text-app-fg md:px-4 md:py-2.5"
            >
              Analytics
            </motion.button>
            <motion.button
              type="button"
              onClick={() => setBreathingOpen(true)}
              whileTap={{ scale: 0.97 }}
              className="rounded-xl border border-app-border bg-app-surface/90 px-3 py-3 text-sm text-app-muted backdrop-blur-sm transition hover:bg-app-surface-strong hover:text-app-fg md:px-4 md:py-2.5"
            >
              Breathing
            </motion.button>
            <motion.button
              type="button"
              onClick={() => setExportOpen(true)}
              whileTap={{ scale: 0.97 }}
              className="rounded-xl border border-app-border bg-app-surface/90 px-3 py-3 text-sm text-app-muted backdrop-blur-sm transition hover:bg-app-surface-strong hover:text-app-fg md:px-4 md:py-2.5"
            >
              Export
            </motion.button>
          </div>

          <div className="w-full md:ml-auto md:w-auto">
            <FilterBar
              category={categoryFilter}
              onCategoryChange={setCategoryFilter}
              sortBy={sortBy}
              onSortChange={setSortBy}
              showArchived={showArchived}
              onToggleArchived={() => setShowArchived((v) => !v)}
              showFavorites={showFavorites}
              onToggleFavorites={() => setShowFavorites((v) => !v)}
              modeFilter={modeFilter}
              onModeChange={setModeFilter}
            />
          </div>
        </div>

        {/* Timer grid/list */}
        {loading ? (
          <LoadingSkeleton
            variant={
              viewMode === "list" || viewMode === "compact" ? "list" : "grid"
            }
          />
        ) : timers.length === 0 ? (
          debouncedSearch ? (
            <EmptyState
              icon="🔍"
              title="No results"
              description={`No timers match "${debouncedSearch}".`}
            />
          ) : showArchived ? (
            <EmptyState
              icon="📦"
              title="No archived timers"
              description="Archived timers will appear here."
            />
          ) : showFavorites ? (
            <EmptyState
              icon="⭐"
              title="No favorites yet"
              description="Mark timers as favorites to see them here."
            />
          ) : (
            <EmptyState
              icon="⏱️"
              title="No timers yet"
              description="Create your first timer to get started!"
              action={{
                label: "Create Timer",
                onClick: () => setCreateOpen(true),
              }}
            />
          )
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={
              viewMode === "list" || viewMode === "compact"
                ? "flex flex-col gap-2"
                : "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4"
            }
          >
            <AnimatePresence mode="popLayout">
              {timers.map((timer) => (
                <motion.div
                  key={timer._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                  <TimerCard
                    timer={timer}
                    onClick={() => setSelectedId(timer._id)}
                    onCountdownComplete={handleCountdownComplete}
                    variant={
                      viewMode === "compact"
                        ? "compact"
                        : viewMode === "list"
                          ? "list"
                          : "grid"
                    }
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <CreateTimerModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />
      <BreathingExercise
        open={breathingOpen}
        onClose={() => setBreathingOpen(false)}
      />
      <AnalyticsDashboard
        open={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
      />
      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Timer?"
        description={`"${deleteConfirm?.title}" will be permanently deleted.`}
        confirmLabel="Delete"
        destructive
        loading={deleting}
      />
      <Confetti
        active={!!confetti?.active}
        color={confetti?.color ?? theme.primary}
      />
    </>
  );
}

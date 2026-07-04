"use client";

import { useTheme } from "@/app/providers/ThemeProvider";
import { useTimerTick } from "@/hooks/useTimerTick";
import { computeElapsedMs } from "@/types/timer";
import type { TimerItem } from "@/types/timer";
import { useState } from "react";
import TimerDisplay from "./TimerDisplay";
import MilestoneBadges from "./MilestoneBadges";
import MilestoneManager from "./MilestoneManager";
import StreakHeatmap from "./StreakHeatmap";
import EntriesPanel from "./EntriesPanel";
import SoundPicker from "./SoundPicker";

type TimerFocusViewProps = {
  timer: TimerItem;
  onBack: () => void;
  onStop: () => void;
  onResync: () => void;
  onDelete: () => void;
  onShare: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onToggleFavorite: () => void;
  onTogglePin: () => void;
  onArchive: () => void;
  onTimerUpdated: (timer: TimerItem) => void;
};

export default function TimerFocusView({
  timer,
  onBack,
  onStop,
  onResync,
  onDelete,
  onShare,
  onEdit,
  onDuplicate,
  onToggleFavorite,
  onTogglePin,
  onArchive,
  onTimerUpdated,
}: TimerFocusViewProps) {
  const [milestoneManagerOpen, setMilestoneManagerOpen] = useState(false);
  const { language } = useTheme();
  const now = useTimerTick(timer.stopped);
  const elapsedMs = computeElapsedMs(timer, now);

  return (
    <div className="relative z-10 mx-auto w-full max-w-2xl flex-1 px-4 pb-8 sm:px-6">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-sm text-white/40 hover:text-white"
      >
        &larr; Dashboard
      </button>

      <div className="rounded-2xl border border-white/8 bg-white/3 p-5 backdrop-blur-md sm:p-7">
        <TimerDisplay
          timer={timer}
          now={now}
          onStop={onStop}
          onResync={onResync}
          onDelete={onDelete}
          onShare={onShare}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onToggleFavorite={onToggleFavorite}
          onTogglePin={onTogglePin}
          onArchive={onArchive}
        />
      </div>

      <div className="mt-4">
        <SoundPicker sound={timer.sound} color={timer.color} />
      </div>

      {timer.mode === "elapsed" && (
        <div className="mt-4 rounded-2xl border border-white/8 bg-white/3 p-4 backdrop-blur-md">
          <MilestoneBadges timer={timer} elapsedMs={elapsedMs} />
          <button
            type="button"
            onClick={() => setMilestoneManagerOpen(true)}
            className="mt-3 w-full rounded-lg border border-white/8 py-2 text-xs text-white/40 hover:text-white/70"
          >
            Manage Milestones
          </button>
        </div>
      )}
      <MilestoneManager
        open={milestoneManagerOpen}
        onClose={() => setMilestoneManagerOpen(false)}
        timer={timer}
        onUpdated={onTimerUpdated}
      />

      {timer.streaks.length > 0 && (
        <div className="mt-4 rounded-2xl border border-white/8 bg-white/3 p-4 backdrop-blur-md">
          <StreakHeatmap
            streaks={timer.streaks}
            currentStreakMs={elapsedMs}
            color={timer.color}
          />
        </div>
      )}

      <EntriesPanel timerId={timer._id} color={timer.color} language={language} />
    </div>
  );
}

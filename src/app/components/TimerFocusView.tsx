"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTimerTick } from "@/hooks/useTimerTick";
import { computeElapsedMs } from "@/types/timer";
import type { TimerItem } from "@/types/timer";
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

const panelVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  }),
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
  const now = useTimerTick(timer.stopped);
  const elapsedMs = computeElapsedMs(timer, now);

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-8 md:px-6">
      <motion.button
        type="button"
        onClick={onBack}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: -4 }}
        className="mb-4 flex items-center gap-2 text-sm text-app-muted transition hover:text-app-fg"
      >
        &larr; Dashboard
      </motion.button>

      <motion.div
        custom={0}
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        className="auth-card-glow rounded-2xl border border-app-border bg-app-surface/90 p-4 backdrop-blur-xl md:p-7"
      >
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
      </motion.div>

      <motion.div
        custom={1}
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        className="mt-4"
      >
        <SoundPicker sound={timer.sound} color={timer.color} />
      </motion.div>

      {timer.mode === "elapsed" && (
        <motion.div
          custom={2}
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          className="mt-4 rounded-2xl border border-app-border bg-app-surface/90 p-4 backdrop-blur-xl"
        >
          <MilestoneBadges timer={timer} elapsedMs={elapsedMs} />
          <motion.button
            type="button"
            onClick={() => setMilestoneManagerOpen(true)}
            whileTap={{ scale: 0.98 }}
            className="mt-3 w-full rounded-lg border border-app-border py-2 text-xs text-app-muted transition hover:bg-app-surface-strong hover:text-app-fg"
          >
            Manage Milestones
          </motion.button>
        </motion.div>
      )}
      <MilestoneManager
        open={milestoneManagerOpen}
        onClose={() => setMilestoneManagerOpen(false)}
        timer={timer}
        onUpdated={onTimerUpdated}
      />

      {timer.streaks.length > 0 && (
        <motion.div
          custom={3}
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          className="mt-4 rounded-2xl border border-app-border bg-app-surface/90 p-4 backdrop-blur-xl"
        >
          <StreakHeatmap
            streaks={timer.streaks}
            currentStreakMs={elapsedMs}
            color={timer.color}
          />
        </motion.div>
      )}

      <motion.div custom={4} variants={panelVariants} initial="hidden" animate="visible">
        <EntriesPanel timerId={timer._id} color={timer.color} />
      </motion.div>
    </div>
  );
}

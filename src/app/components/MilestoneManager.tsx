"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/app/providers/ThemeProvider";
import { updateTimer } from "@/lib/api/timers";
import { formatDuration } from "@/lib/utils";
import ModalBackdrop from "@/components/ui/ModalBackdrop";
import ErrorBanner from "@/components/ui/ErrorBanner";
import type { TimerItem, MilestoneDefinition } from "@/types/timer";

const PRESET_ICONS = ["⭐", "🌟", "🏅", "🏆", "💎", "👑", "🔥", "💯", "🎯", "🎉", "💪", "🚀"];

const PRESET_DURATIONS: { label: string; ms: number }[] = [
  { label: "1 hour", ms: 3_600_000 },
  { label: "24 hours", ms: 86_400_000 },
  { label: "7 days", ms: 604_800_000 },
  { label: "30 days", ms: 2_592_000_000 },
  { label: "100 days", ms: 8_640_000_000 },
  { label: "365 days", ms: 31_536_000_000 },
];

type Props = {
  open: boolean;
  onClose: () => void;
  timer: TimerItem;
  onUpdated: (timer: TimerItem) => void;
};

export default function MilestoneManager({ open, onClose, timer, onUpdated }: Props) {
  const { theme } = useTheme();
  const [milestones, setMilestones] = useState<MilestoneDefinition[]>(
    timer.milestoneConfig.customMilestones,
  );
  const [newLabel, setNewLabel] = useState("");
  const [newDays, setNewDays] = useState("");
  const [newHours, setNewHours] = useState("");
  const [newIcon, setNewIcon] = useState("⭐");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMilestones(timer.milestoneConfig.customMilestones);
    setError(null);
  }, [open, timer._id, timer.milestoneConfig.customMilestones]);

  function addPreset(d: { label: string; ms: number }) {
    if (milestones.some((m) => m.durationMs === d.ms)) return;
    setMilestones((prev) =>
      [...prev, { label: d.label, durationMs: d.ms, icon: "⭐" }].sort(
        (a, b) => a.durationMs - b.durationMs,
      ),
    );
  }

  function addCustom() {
    setError(null);
    const label = newLabel.trim();
    if (!label) { setError("Label required."); return; }
    const days = Number(newDays) || 0;
    const hours = Number(newHours) || 0;
    const ms = days * 86_400_000 + hours * 3_600_000;
    if (ms <= 0) { setError("Duration must be positive."); return; }
    if (milestones.some((m) => m.durationMs === ms)) { setError("Duplicate duration."); return; }

    setMilestones((prev) =>
      [...prev, { label, durationMs: ms, icon: newIcon }].sort((a, b) => a.durationMs - b.durationMs),
    );
    setNewLabel("");
    setNewDays("");
    setNewHours("");
    setNewIcon("⭐");
  }

  function remove(index: number) {
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  }

  async function save() {
    setSaving(true);
    try {
      const updated = await updateTimer(timer._id, {
        milestoneConfig: {
          enabled: true,
          customMilestones: milestones,
        },
      });
      onUpdated(updated);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalBackdrop open={open} onClose={onClose}>
      <h2 className="mb-4 text-lg font-bold text-white/90">Manage Milestones</h2>

      {/* Quick add presets */}
      <div className="mb-4">
        <div className="mb-1.5 text-xs text-white/45">Quick Add Preset</div>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_DURATIONS.map((d) => (
            <button
              key={d.ms}
              type="button"
              onClick={() => addPreset(d)}
              disabled={milestones.some((m) => m.durationMs === d.ms)}
              className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/60 transition hover:bg-white/5 disabled:opacity-30"
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom milestone form */}
      <div className="mb-4 space-y-2 rounded-xl border border-white/8 bg-white/3 p-3">
        <div className="text-xs font-medium text-white/50">Add Custom Milestone</div>
        <div className="flex gap-2">
          <input type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Label" maxLength={50} className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-xs text-white outline-none" />
          <input type="number" value={newDays} onChange={(e) => setNewDays(e.target.value)} placeholder="Days" min={0} className="w-16 rounded-lg border border-white/10 bg-black/60 px-2 py-2 text-xs text-white outline-none" />
          <input type="number" value={newHours} onChange={(e) => setNewHours(e.target.value)} placeholder="Hrs" min={0} className="w-14 rounded-lg border border-white/10 bg-black/60 px-2 py-2 text-xs text-white outline-none" />
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[10px] text-white/40">Icon:</div>
          {PRESET_ICONS.map((icon) => (
            <button key={icon} type="button" onClick={() => setNewIcon(icon)} className={`text-sm ${newIcon === icon ? "scale-125" : "opacity-50"}`}>{icon}</button>
          ))}
          <button type="button" onClick={addCustom} className="ml-auto rounded-lg px-3 py-1.5 text-xs font-semibold text-black" style={{ backgroundColor: theme.primary }}>
            Add
          </button>
        </div>
      </div>

      {/* Current milestones list */}
      <div className="mb-4 max-h-60 overflow-y-auto">
        {milestones.length === 0 ? (
          <div className="py-6 text-center text-xs text-white/35">No custom milestones. Default milestones will be used.</div>
        ) : (
          <div className="space-y-1.5">
            {milestones.map((m, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/3 px-3 py-2 text-xs">
                <span>{m.icon}</span>
                <span className="flex-1 text-white/70">{m.label}</span>
                <span className="text-white/40">{formatDuration(m.durationMs)}</span>
                <button type="button" onClick={() => remove(i)} className="text-red-300/60 hover:text-red-200">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ErrorBanner message={error} onDismiss={() => setError(null)} className="mb-3" />

      <div className="flex gap-3">
        <button type="button" onClick={save} disabled={saving} className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-black disabled:opacity-50" style={{ backgroundColor: theme.primary }}>
          {saving ? "Saving..." : "Save Milestones"}
        </button>
        <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white/50 hover:text-white">Cancel</button>
      </div>
    </ModalBackdrop>
  );
}

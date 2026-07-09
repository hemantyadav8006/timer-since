"use client";

import { useState } from "react";
import { useTheme } from "@/app/providers/ThemeProvider";
import { updateTimer } from "@/lib/api/timers";
import { useToast } from "@/components/ui/Toast";
import ModalBackdrop from "@/components/ui/ModalBackdrop";
import type { TimerItem } from "@/types/timer";

type ShareDialogProps = {
  open: boolean;
  onClose: () => void;
  timer: TimerItem | null;
  onTimerUpdated: (timer: TimerItem) => void;
};

export default function ShareDialog({ open, onClose, timer, onTimerUpdated }: ShareDialogProps) {
  const { theme } = useTheme();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [toggling, setToggling] = useState(false);

  if (!timer) return null;

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/share/${timer.shareId}` : "";

  async function togglePublic() {
    if (!timer) return;
    setToggling(true);
    try {
      const updated = await updateTimer(timer._id, { isPublic: !timer.isPublic });
      onTimerUpdated(updated);
    } catch {
      toast("Failed to update sharing settings.", "error");
    } finally { setToggling(false); }
  }

  function copyLink() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <ModalBackdrop open={open} onClose={onClose} maxWidth="max-w-sm">
      <h2 className="mb-4 text-center text-lg font-bold text-white/90">Share Timer</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">Make Public</span>
          <button type="button" onClick={togglePublic} disabled={toggling} className="relative h-6 w-11 rounded-full transition" style={{ backgroundColor: timer.isPublic ? theme.primary : "rgba(255,255,255,0.15)" }} role="switch" aria-checked={timer.isPublic}>
            <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${timer.isPublic ? "translate-x-5" : ""}`} />
          </button>
        </div>
        {timer.isPublic && (
          <div>
            <div className="mb-1 text-xs text-white/45">Share link</div>
            <div className="flex items-center gap-2">
              <input type="text" value={shareUrl} readOnly className="flex-1 rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-xs text-white/70 outline-none" />
              <button type="button" onClick={copyLink} className="rounded-lg px-3 py-2 text-xs font-medium text-black" style={{ backgroundColor: theme.primary }}>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}
      </div>
      <button type="button" onClick={onClose} className="mt-4 w-full rounded-xl border border-white/10 py-2 text-sm text-white/45 hover:text-white">Close</button>
    </ModalBackdrop>
  );
}

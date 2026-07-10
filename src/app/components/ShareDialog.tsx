"use client";

import { useEffect, useState } from "react";
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

export default function ShareDialog({
  open,
  onClose,
  timer,
  onTimerUpdated,
}: ShareDialogProps) {
  const { theme } = useTheme();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [draft, setDraft] = useState<TimerItem | null>(timer);

  useEffect(() => {
    if (open) setDraft(timer);
  }, [open, timer]);

  if (!draft) return null;

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/share/${draft.shareId}`
      : "";

  async function togglePublic() {
    if (!draft) return;
    const nextPublic = !draft.isPublic;
    setDraft({ ...draft, isPublic: nextPublic });
    setToggling(true);
    try {
      const updated = await updateTimer(draft._id, {
        isPublic: nextPublic,
      });
      setDraft(updated);
      onTimerUpdated(updated);
    } catch {
      setDraft({ ...draft, isPublic: !nextPublic });
      toast("Failed to update sharing settings.", "error");
    } finally {
      setToggling(false);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <ModalBackdrop open={open} onClose={onClose} maxWidth="max-w-sm">
      <h2 className="mb-4 text-center text-lg font-bold text-app-fg">
        Share Timer
      </h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-app-muted">Make Public</span>
          <button
            type="button"
            onClick={togglePublic}
            disabled={toggling}
            className="relative h-6 w-11 rounded-full transition"
            style={{
              backgroundColor: draft.isPublic
                ? theme.primary
                : "var(--app-toggle-off)",
            }}
            role="switch"
            aria-checked={draft.isPublic}
          >
            <span
              className={`absolute left-0.5 top-[2.5px] h-5 w-5 rounded-full border border-white bg-app-surface-strong transition-all duration-300 ${draft.isPublic ? "translate-x-5" : ""}`}
            />
          </button>
        </div>
        {draft.isPublic && (
          <div>
            <div className="mb-1 text-xs text-app-muted">Share link</div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 rounded-lg border border-app-border bg-app-input px-3 py-2 text-xs text-app-fg outline-none"
              />
              <button
                type="button"
                onClick={copyLink}
                className="rounded-lg px-3 py-2 text-xs font-medium text-black"
                style={{ backgroundColor: theme.primary }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="mt-4 w-full rounded-xl border border-app-border py-2 text-sm text-app-muted hover:text-app-fg"
      >
        Close
      </button>
    </ModalBackdrop>
  );
}

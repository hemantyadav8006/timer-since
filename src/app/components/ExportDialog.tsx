"use client";

import { useState } from "react";
import { useTheme } from "@/app/providers/ThemeProvider";
import { useToast } from "@/components/ui/Toast";
import { handleAuthFailure } from "@/lib/api/http";
import ModalBackdrop from "@/components/ui/ModalBackdrop";

type ExportDialogProps = { open: boolean; onClose: () => void };

export default function ExportDialog({ open, onClose }: ExportDialogProps) {
  const { theme } = useTheme();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  async function handleExport(format: "json" | "csv") {
    setExporting(true);
    try {
      const res = await fetch(`/api/export?format=${format}`);
      handleAuthFailure(res);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `timers-export.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast("Export downloaded!", "success");
      onClose();
    } catch {
      toast("Export failed.", "error");
    } finally {
      setExporting(false);
    }
  }

  return (
    <ModalBackdrop open={open} onClose={onClose} maxWidth="max-w-xs">
      <h2 className="mb-4 text-center text-lg font-bold text-app-fg">
        Export Data
      </h2>
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => handleExport("json")}
          disabled={exporting}
          className="w-full rounded-xl border border-app-border bg-app-surface px-4 py-3 text-sm font-medium text-app-fg transition hover:bg-app-surface-strong disabled:opacity-50"
        >
          Export JSON
        </button>
        <button
          type="button"
          onClick={() => handleExport("csv")}
          disabled={exporting}
          className="w-full rounded-xl border border-app-border bg-app-surface px-4 py-3 text-sm font-medium text-app-fg transition hover:bg-app-surface-strong disabled:opacity-50"
        >
          Export CSV
        </button>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="mt-4 w-full rounded-xl py-2 text-sm text-app-muted hover:text-app-fg"
      >
        Cancel
      </button>
    </ModalBackdrop>
  );
}

"use client";

import ModalBackdrop from "./ModalBackdrop";

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
};

/**
 * Reusable confirmation dialog built on ModalBackdrop.
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <ModalBackdrop open={open} onClose={onClose} maxWidth="max-w-sm">
      <h2 className="text-lg font-bold text-app-fg">{title}</h2>
      {description && (
        <p className="mt-2 text-sm text-app-muted">{description}</p>
      )}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
            destructive
              ? "border border-red-500/30 bg-red-500/15 text-app-danger hover:bg-red-500/25"
              : "bg-app-surface-strong text-app-fg hover:bg-app-surface-strong"
          }`}
        >
          {loading ? "..." : confirmLabel}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-app-border px-4 py-2.5 text-sm text-app-muted hover:text-app-fg"
        >
          {cancelLabel}
        </button>
      </div>
    </ModalBackdrop>
  );
}

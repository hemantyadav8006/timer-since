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
      <h2 className="text-lg font-bold text-white/90">{title}</h2>
      {description && (
        <p className="mt-2 text-sm text-white/55">{description}</p>
      )}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
            destructive
              ? "border border-red-500/30 bg-red-500/15 text-red-200 hover:bg-red-500/25"
              : "bg-white/15 text-white hover:bg-white/20"
          }`}
        >
          {loading ? "..." : confirmLabel}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60 hover:text-white"
        >
          {cancelLabel}
        </button>
      </div>
    </ModalBackdrop>
  );
}

"use client";

type ConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" = botón rojo (eliminar), "primary" = naranja */
  variant?: "danger" | "primary";
  loading?: boolean;
};

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  loading = false,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        aria-hidden
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-sm rounded-xl border border-white/[0.1] bg-[#0b1424] px-4 py-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="confirm-modal-title"
          className="text-sm font-semibold text-xalisco-cream sm:text-base"
        >
          {title}
        </h2>
        <p className="mt-2 text-xs text-xalisco-cream/80 sm:text-sm">
          {message}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/[0.2] px-3 py-2 text-xs font-medium text-xalisco-cream/90 hover:bg-white/[0.06] sm:text-sm"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={
              variant === "danger"
                ? "rounded-md bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60 sm:text-sm"
                : "rounded-md bg-xalisco-burnt-orange px-3 py-2 text-xs font-medium text-xalisco-black hover:bg-xalisco-burnt-orange-hover disabled:opacity-60 sm:text-sm"
            }
          >
            {loading ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

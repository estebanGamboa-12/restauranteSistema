"use client";

import { ReactNode } from "react";

type DashboardModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** max width: sm (24rem), md (28rem), lg (32rem), xl (36rem), 2xl (42rem) */
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  /** Si true, el cuerpo hace scroll cuando el contenido es largo */
  scrollable?: boolean;
};

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

export function DashboardModal({
  open,
  onClose,
  title,
  children,
  size = "lg",
  scrollable = true,
}: DashboardModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-modal-title"
    >
      {/* Overlay opaco: cierra al hacer clic */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        aria-hidden
        onClick={onClose}
      />
      {/* Panel: fondo sólido, sin transparencia */}
      <div
        className={`
          relative w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col
          rounded-xl border border-white/[0.1] bg-[#0b1424] shadow-2xl
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-4 py-3">
          <h2
            id="dashboard-modal-title"
            className="text-sm font-semibold text-xalisco-cream sm:text-base"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-xalisco-cream/60 transition-colors hover:bg-white/[0.06] hover:text-xalisco-cream"
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div
          className={
            scrollable
              ? "flex-1 overflow-y-auto px-4 py-4"
              : "flex-1 px-4 py-4"
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
}

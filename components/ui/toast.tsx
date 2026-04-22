 "use client";

import { createContext, useContext, useState, ReactNode } from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: number;
  type: ToastType;
  message: string;
};

type ToastContextValue = {
  showToast: (opts: { type: ToastType; message: string }) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function showToast({ type, message }: { type: ToastType; message: string }) {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto w-full max-w-sm rounded-lg border px-3 py-2.5 text-xs shadow-lg backdrop-blur ${
              toast.type === "success"
                ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                : toast.type === "error"
                ? "border-red-400/40 bg-red-500/10 text-red-100"
                : "border-sky-400/40 bg-sky-500/10 text-sky-100"
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-[11px]">
                {toast.type === "success"
                  ? "✔"
                  : toast.type === "error"
                  ? "✕"
                  : "i"}
              </span>
              <p className="text-[11px] leading-snug">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}


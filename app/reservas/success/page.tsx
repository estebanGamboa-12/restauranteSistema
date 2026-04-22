import { Suspense } from "react";
import { ReservaSuccessClient } from "./success-client";

export default function ReservaSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
          <p className="text-sm text-xalisco-cream/70">Cargando…</p>
        </div>
      }
    >
      <ReservaSuccessClient />
    </Suspense>
  );
}


"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function ReservaCancelClient() {
  const params = useSearchParams();
  const reservationId = params.get("reservation_id");

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-xs uppercase tracking-[0.28em] text-xalisco-gold">
        Pago cancelado
      </p>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-xalisco-cream md:text-5xl">
        No se ha completado la reserva
      </h1>
      <p className="mt-4 text-sm text-xalisco-cream/75">
        Has cancelado el pago. No pasa nada: puedes volver a intentarlo cuando quieras.
      </p>

      {reservationId && (
        <p className="mt-4 text-[11px] text-xalisco-cream/60">
          ID de reserva: <span className="text-xalisco-cream/80">{reservationId}</span>
        </p>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/reservas"
          className="rounded-md bg-xalisco-burnt-orange px-5 py-2.5 text-sm font-medium text-xalisco-black hover:bg-xalisco-burnt-orange-hover"
        >
          Reintentar pago
        </Link>
        <Link
          href="/contacto"
          className="rounded-md border border-white/[0.16] px-5 py-2.5 text-sm text-xalisco-cream/90 hover:border-xalisco-gold/60"
        >
          Contacto
        </Link>
      </div>
    </div>
  );
}


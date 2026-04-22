"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function ReservaSuccessClient() {
  const params = useSearchParams();
  const reservationId = params.get("reservation_id");
  const [status, setStatus] = useState<string | null>(null);
  const [depositPaid, setDepositPaid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!reservationId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const poll = async () => {
      try {
        const res = await fetch(`/api/public/reservations/${reservationId}`, {
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return;
        const r = data.reservation;
        if (!cancelled && r) {
          setStatus(r.status ?? null);
          setDepositPaid(!!r.deposit_paid);
          if (r.status === "confirmed") return;
        }
      } catch {
        // ignore
      }
      timer = setTimeout(poll, 2500);
    };
    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [reservationId]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-xs uppercase tracking-[0.28em] text-xalisco-gold">
        Pago completado
      </p>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-xalisco-cream md:text-5xl">
        Reserva recibida
      </h1>
      <p className="mt-4 text-sm text-xalisco-cream/75">
        Hemos recibido tu pago.{" "}
        {status === "confirmed"
          ? "Tu reserva está confirmada."
          : "Estamos confirmando tu reserva…"}
      </p>

      {reservationId && (
        <p className="mt-4 text-[11px] text-xalisco-cream/60">
          ID de reserva:{" "}
          <span className="text-xalisco-cream/80">{reservationId}</span>
        </p>
      )}
      {depositPaid !== null && (
        <p className="mt-2 text-[11px] text-xalisco-cream/60">
          Depósito:{" "}
          <span className="text-xalisco-cream/80">
            {depositPaid ? "pagado" : "pendiente"}
          </span>
        </p>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="rounded-md border border-white/[0.16] px-5 py-2.5 text-sm text-xalisco-cream/90 hover:border-xalisco-gold/60"
        >
          Volver al inicio
        </Link>
        <Link
          href="/reservas"
          className="rounded-md bg-xalisco-burnt-orange px-5 py-2.5 text-sm font-medium text-xalisco-black hover:bg-xalisco-burnt-orange-hover"
        >
          Hacer otra reserva
        </Link>
        <Link
          href={
            reservationId
              ? `/reservas/cancelar?reservation_id=${encodeURIComponent(reservationId)}`
              : "/reservas/cancelar"
          }
          className="rounded-md border border-white/[0.16] px-5 py-2.5 text-sm text-xalisco-cream/90 hover:border-xalisco-gold/60"
        >
          Cancelar / reembolso
        </Link>
      </div>
    </div>
  );
}


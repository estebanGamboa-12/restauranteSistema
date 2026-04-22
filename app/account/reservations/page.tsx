"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSiteAuth } from "@/components/providers/SiteAuthProvider";

type Reservation = {
  id: string;
  reservation_date: string;
  reservation_time: string;
  guests: number;
  status: string;
  zone_name: string | null;
  meal_type: string | null;
  notes: string | null;
  deposit_paid: boolean;
};

function formatDate(iso: string): string {
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function isUpcoming(r: Reservation): boolean {
  const dt = new Date(`${r.reservation_date}T${r.reservation_time}`);
  return dt.getTime() > Date.now();
}

export default function AccountReservationsPage() {
  const { fetchWithAuth } = useSiteAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [working, setWorking] = useState<string | null>(null);

  // edición inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth("/api/account/reservations", {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudieron cargar tus reservas.");
      } else {
        setReservations(
          Array.isArray(data.reservations) ? data.reservations : []
        );
      }
    } catch {
      setError("No se pudieron cargar tus reservas.");
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    void load();
  }, [load]);

  const { upcoming, past } = useMemo(() => {
    const up: Reservation[] = [];
    const pa: Reservation[] = [];
    for (const r of reservations) {
      if (isUpcoming(r) && r.status !== "cancelled" && r.status !== "cancelada") {
        up.push(r);
      } else {
        pa.push(r);
      }
    }
    up.sort((a, b) =>
      `${a.reservation_date}T${a.reservation_time}`.localeCompare(
        `${b.reservation_date}T${b.reservation_time}`
      )
    );
    pa.sort((a, b) =>
      `${b.reservation_date}T${b.reservation_time}`.localeCompare(
        `${a.reservation_date}T${a.reservation_time}`
      )
    );
    return { upcoming: up, past: pa };
  }, [reservations]);

  async function handleCancel(id: string) {
    if (
      !confirm(
        "¿Seguro que quieres cancelar esta reserva? Si estás dentro de la ventana de reembolso, tu depósito se devolverá."
      )
    )
      return;
    setWorking(id);
    setMessage(null);
    setError(null);
    try {
      const res = await fetchWithAuth(`/api/account/reservations/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo cancelar la reserva.");
      } else {
        setMessage(
          data.refunded
            ? "Reserva cancelada. Depósito reembolsado."
            : "Reserva cancelada."
        );
        await load();
      }
    } catch {
      setError("No se pudo cancelar la reserva.");
    } finally {
      setWorking(null);
    }
  }

  function startEdit(r: Reservation) {
    setEditingId(r.id);
    setNewDate(r.reservation_date);
    setNewTime(r.reservation_time.slice(0, 5));
    setMessage(null);
    setError(null);
  }

  async function handleSaveEdit(id: string) {
    if (!newDate || !newTime) {
      setError("Debes elegir fecha y hora.");
      return;
    }
    setWorking(id);
    setError(null);
    try {
      const res = await fetchWithAuth(`/api/account/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservation_date: newDate,
          reservation_time: newTime,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo mover la reserva.");
      } else {
        setMessage("Reserva actualizada.");
        setEditingId(null);
        await load();
      }
    } catch {
      setError("No se pudo mover la reserva.");
    } finally {
      setWorking(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-xalisco-cream/70">Cargando reservas...</p>;
  }

  return (
    <div className="space-y-8">
      {error ? (
        <p className="rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-xs text-red-200">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-3 text-xs text-emerald-200">
          {message}
        </p>
      ) : null}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-xalisco-cream">
            Próximas reservas
          </h2>
          <Link
            href="/reservas"
            className="rounded-md bg-xalisco-burnt-orange px-3 py-1.5 text-[11px] font-semibold text-xalisco-black hover:bg-xalisco-burnt-orange-hover"
          >
            Nueva reserva
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <p className="rounded-lg border border-white/[0.08] bg-black/20 p-4 text-xs text-xalisco-cream/60">
            No tienes reservas próximas.
          </p>
        ) : (
          <ul className="space-y-3">
            {upcoming.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-white/[0.08] bg-black/25 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="text-sm text-xalisco-cream">
                    <div className="font-semibold">
                      {formatDate(r.reservation_date)} ·{" "}
                      {r.reservation_time.slice(0, 5)}
                    </div>
                    <div className="mt-1 text-xs text-xalisco-cream/70">
                      {r.guests} personas
                      {r.zone_name ? ` · ${r.zone_name}` : ""}
                      {r.meal_type ? ` · ${r.meal_type}` : ""}
                    </div>
                    <div className="mt-1 text-[11px] capitalize text-xalisco-cream/60">
                      Estado: {r.status}
                      {r.deposit_paid ? " · Depósito pagado" : ""}
                    </div>
                    {r.notes ? (
                      <p className="mt-2 text-[11px] text-xalisco-cream/60">
                        {r.notes}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => startEdit(r)}
                      disabled={working === r.id}
                      className="rounded-md border border-white/[0.18] px-2.5 py-1.5 text-xalisco-cream/85 hover:border-xalisco-gold-bright/80 disabled:opacity-60"
                    >
                      Mover
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleCancel(r.id)}
                      disabled={working === r.id}
                      className="rounded-md border border-red-400/40 px-2.5 py-1.5 text-red-200 hover:border-red-300 disabled:opacity-60"
                    >
                      {working === r.id ? "..." : "Cancelar"}
                    </button>
                  </div>
                </div>

                {editingId === r.id ? (
                  <div className="mt-3 flex flex-wrap items-end gap-2 rounded-lg border border-white/[0.1] bg-black/40 p-3 text-[11px] text-xalisco-cream/85">
                    <div className="flex flex-col">
                      <label className="mb-1 text-xalisco-cream/70">
                        Nueva fecha
                      </label>
                      <input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="rounded-md border border-white/[0.15] bg-transparent px-2 py-1 text-xalisco-cream outline-none"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="mb-1 text-xalisco-cream/70">
                        Nueva hora
                      </label>
                      <input
                        type="time"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className="rounded-md border border-white/[0.15] bg-transparent px-2 py-1 text-xalisco-cream outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleSaveEdit(r.id)}
                      disabled={working === r.id}
                      className="rounded-md bg-xalisco-burnt-orange px-3 py-1.5 font-semibold text-xalisco-black hover:bg-xalisco-burnt-orange-hover disabled:opacity-60"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-md border border-white/[0.15] px-3 py-1.5 text-xalisco-cream/80 hover:border-xalisco-gold/50"
                    >
                      Cancelar edición
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-xalisco-cream">
          Historial
        </h2>
        {past.length === 0 ? (
          <p className="rounded-lg border border-white/[0.08] bg-black/20 p-4 text-xs text-xalisco-cream/60">
            Aún no hay historial.
          </p>
        ) : (
          <ul className="space-y-2">
            {past.map((r) => (
              <li
                key={r.id}
                className="rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2 text-xs text-xalisco-cream/80"
              >
                {formatDate(r.reservation_date)} ·{" "}
                {r.reservation_time.slice(0, 5)} · {r.guests} pers.
                {r.zone_name ? ` · ${r.zone_name}` : ""}
                <span className="ml-2 text-[10px] capitalize text-xalisco-cream/50">
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

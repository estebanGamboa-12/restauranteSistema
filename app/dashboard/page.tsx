"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  CalendarRange,
  MapPinned,
  Sparkles,
  TrendingUp,
  Clock,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useDashboardAuth } from "@/components/dashboard/DashboardAuthProvider";

type StatCardProps = {
  label: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  accent?: "orange" | "gold" | "cream";
};

function StatCard({
  label,
  value,
  description,
  icon: Icon,
  accent = "orange",
}: StatCardProps) {
  const accentClass =
    accent === "gold"
      ? "bg-xalisco-gold/15 text-xalisco-gold-bright"
      : accent === "cream"
        ? "bg-white/10 text-xalisco-cream"
        : "bg-xalisco-burnt-orange/15 text-xalisco-burnt-orange";
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[color:var(--xalisco-border)] bg-xalisco-black-soft/60 p-4 transition-colors hover:border-xalisco-burnt-orange/40 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-xalisco-muted">
            {label}
          </div>
          <div className="mt-2 text-2xl font-bold text-xalisco-cream sm:text-3xl">
            {value}
          </div>
          {description && (
            <p className="mt-1.5 line-clamp-2 text-[11px] text-xalisco-cream/60">
              {description}
            </p>
          )}
        </div>
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accentClass}`}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </div>
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
};

function statusPillClass(status?: string) {
  switch (status) {
    case "pending":
      return "bg-yellow-500/10 text-yellow-300 ring-1 ring-inset ring-yellow-500/20";
    case "confirmed":
      return "bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-500/20";
    case "cancelled":
      return "bg-red-500/10 text-red-300 ring-1 ring-inset ring-red-500/20";
    case "completed":
      return "bg-sky-500/10 text-sky-300 ring-1 ring-inset ring-sky-500/20";
    default:
      return "bg-white/5 text-xalisco-cream/70 ring-1 ring-inset ring-white/10";
  }
}

export default function DashboardPage() {
  const { fetchWithAuth } = useDashboardAuth();
  const [todayReservations, setTodayReservations] = useState(0);
  const [weekReservations, setWeekReservations] = useState(0);
  const [occupiedTablesToday, setOccupiedTablesToday] = useState(0);
  const [newCustomers, setNewCustomers] = useState(0);
  const [chartData, setChartData] = useState<
    { date: string; label: string; count: number; isToday: boolean }[]
  >([]);
  type ResItem = {
    id?: string;
    reservation_date: string;
    reservation_time: string;
    customer_name: string;
    guests?: number;
    status?: string;
    customer_email?: string;
    customer_phone?: string;
    table_id?: string;
  };
  const [upcoming, setUpcoming] = useState<ResItem[]>([]);
  const [tablesTotal, setTablesTotal] = useState(0);

  useEffect(() => {
    async function load() {
      const [resReservations, resTables] = await Promise.all([
        fetchWithAuth("/api/dashboard/reservations"),
        fetchWithAuth("/api/dashboard/tables"),
      ]);
      const dataReservations = await resReservations.json();
      const dataTables = await resTables.json();
      if (!resReservations.ok || !Array.isArray(dataReservations.reservations))
        return;

      const reservations = dataReservations.reservations as ResItem[];
      const tables = Array.isArray(dataTables.tables) ? dataTables.tables : [];
      setTablesTotal(tables.length);

      const today = new Date();
      const todayIso = today.toISOString().slice(0, 10);
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      let todayCount = 0;
      let weekCount = 0;
      const occupiedTableIds = new Set<string>();
      const upcomingList: ResItem[] = [];
      const customerMap = new Map<string, { firstDate: string }>();
      const chartMap = new Map<string, number>();

      for (const r of reservations) {
        const date: string = r.reservation_date;
        const time: string = r.reservation_time;
        const dt = new Date(`${date}T${time}`);

        if (date === todayIso) {
          todayCount += 1;
          if (r.table_id) occupiedTableIds.add(r.table_id as string);
        }
        if (dt >= weekStart && dt < weekEnd) {
          weekCount += 1;
        }

        const key = `${r.customer_name}|${r.customer_email ?? ""}|${r.customer_phone ?? ""}`;
        const existing = customerMap.get(key);
        if (!existing || date < existing.firstDate) {
          customerMap.set(key, { firstDate: date });
        }

        const dateObj = new Date(date);
        const chartKey = dateObj.toISOString().slice(0, 10);
        chartMap.set(chartKey, (chartMap.get(chartKey) ?? 0) + 1);

        if (date >= todayIso) upcomingList.push(r);
      }

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);
      const sevenAgoIso = sevenDaysAgo.toISOString().slice(0, 10);
      let newCustomersCount = 0;
      for (const { firstDate } of Array.from(customerMap.values())) {
        if (firstDate >= sevenAgoIso) newCustomersCount += 1;
      }

      const chartArray: {
        date: string;
        label: string;
        count: number;
        isToday: boolean;
      }[] = [];
      for (let i = -3; i <= 3; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const iso = d.toISOString().slice(0, 10);
        const count = chartMap.get(iso) ?? 0;
        chartArray.push({
          date: iso,
          label: d.toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
          }),
          count,
          isToday: iso === todayIso,
        });
      }

      upcomingList.sort((a, b) => {
        const aDt = new Date(`${a.reservation_date}T${a.reservation_time}`);
        const bDt = new Date(`${b.reservation_date}T${b.reservation_time}`);
        return aDt.getTime() - bDt.getTime();
      });

      setTodayReservations(todayCount);
      setWeekReservations(weekCount);
      setOccupiedTablesToday(occupiedTableIds.size);
      setNewCustomers(newCustomersCount);
      setChartData(chartArray);
      setUpcoming(upcomingList.slice(0, 8));
    }
    void load();
  }, [fetchWithAuth]);

  const maxCount = Math.max(1, ...chartData.map((d) => d.count));
  const occupancyPct =
    tablesTotal === 0 ? 0 : (occupiedTablesToday / tablesTotal) * 100;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-xalisco-cream sm:text-2xl">
          Panel
        </h2>
        <p className="mt-1 text-xs text-xalisco-cream/60">
          Resumen de reservas y actividad.
        </p>
      </div>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Hoy"
          value={todayReservations}
          description="Reservas con fecha de hoy"
          icon={Calendar}
          accent="orange"
        />
        <StatCard
          label="Esta semana"
          value={weekReservations}
          description="Total de la semana actual"
          icon={CalendarRange}
          accent="gold"
        />
        <StatCard
          label="Zonas activas"
          value={`${occupiedTablesToday}/${tablesTotal}`}
          description="Zonas con al menos una reserva hoy"
          icon={MapPinned}
          accent="cream"
        />
        <StatCard
          label="Nuevos clientes"
          value={newCustomers}
          description="Primera reserva (últimos 7 días)"
          icon={Sparkles}
          accent="orange"
        />
      </section>

      {/* Chart + Ocupación */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[color:var(--xalisco-border)] bg-xalisco-black-soft/60 p-4 sm:p-5 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-xalisco-cream">
                <TrendingUp className="h-4 w-4 text-xalisco-burnt-orange" />
                Reservas por día
              </h3>
              <p className="mt-1 text-[11px] text-xalisco-cream/60">
                3 días atrás y próximos 3 días.
              </p>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-xalisco-muted">
                Máx
              </div>
              <div className="text-sm font-semibold text-xalisco-cream">
                {maxCount}
              </div>
            </div>
          </div>
          <div className="mt-5 flex h-40 items-end gap-1.5 sm:gap-2">
            {chartData.map((d) => {
              const heightPct = d.count === 0 ? 4 : (d.count / maxCount) * 100;
              return (
                <div
                  key={d.date}
                  className="flex flex-1 flex-col items-center gap-1.5"
                >
                  <div className="text-[10px] font-medium text-xalisco-cream/80">
                    {d.count}
                  </div>
                  <div className="relative flex h-full w-full items-end">
                    <div
                      className={`w-full rounded-t-md bg-gradient-to-t transition-all ${
                        d.isToday
                          ? "from-xalisco-burnt-orange to-xalisco-gold-bright shadow-[0_0_20px_rgba(232,108,62,0.4)]"
                          : "from-xalisco-burnt-orange/60 to-xalisco-gold/70"
                      }`}
                      style={{ height: `${Math.max(heightPct, 3)}%` }}
                    />
                  </div>
                  <span
                    className={`text-[10px] ${
                      d.isToday
                        ? "font-semibold text-xalisco-gold-bright"
                        : "text-xalisco-cream/60"
                    }`}
                  >
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-2xl border border-[color:var(--xalisco-border)] bg-xalisco-black-soft/60 p-4 sm:p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-xalisco-cream">
            <MapPinned className="h-4 w-4 text-xalisco-burnt-orange" />
            Ocupación
          </h3>
          <p className="mt-1 text-[11px] text-xalisco-cream/60">
            Zonas con reservas hoy.
          </p>
          <div className="mt-5 flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <path
                  className="text-white/8"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  stroke="url(#occ-grad)"
                  strokeWidth="3.5"
                  strokeDasharray={`${occupancyPct}, 100`}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <defs>
                  <linearGradient
                    id="occ-grad"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#e86c3e" />
                    <stop offset="100%" stopColor="#f5c87a" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-xalisco-cream">
                  {Math.round(occupancyPct)}%
                </span>
              </div>
            </div>
            <div className="min-w-0 flex-1 text-sm">
              <div className="truncate font-semibold text-xalisco-cream">
                {tablesTotal === 0
                  ? "Sin zonas"
                  : `${occupiedTablesToday} de ${tablesTotal} zonas`}
              </div>
              <div className="mt-0.5 text-[11px] text-xalisco-cream/60">
                Basado en reservas de hoy.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Próximas reservas */}
      <section className="rounded-2xl border border-[color:var(--xalisco-border)] bg-xalisco-black-soft/60 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-xalisco-cream">
              <Clock className="h-4 w-4 text-xalisco-burnt-orange" />
              Próximas reservas
            </h3>
            <p className="mt-1 text-[11px] text-xalisco-cream/60">
              Futuras, ordenadas por fecha y hora.
            </p>
          </div>
          <span className="rounded-full bg-xalisco-burnt-orange/15 px-2 py-0.5 text-[10px] font-semibold text-xalisco-burnt-orange ring-1 ring-inset ring-xalisco-burnt-orange/30">
            {upcoming.length}
          </span>
        </div>

        {/* Mobile: cards */}
        <div className="mt-4 grid gap-2 sm:hidden">
          {upcoming.length === 0 ? (
            <p className="rounded-xl bg-white/[0.02] py-6 text-center text-xs text-xalisco-cream/50">
              No hay reservas futuras.
            </p>
          ) : (
            upcoming.map((r) => (
              <div
                key={
                  r.id ??
                  `${r.reservation_date}-${r.reservation_time}-${r.customer_name}`
                }
                className="flex items-center gap-3 rounded-xl border border-[color:var(--xalisco-border)] bg-black/20 p-3"
              >
                <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-xalisco-burnt-orange/15 text-xalisco-burnt-orange">
                  <span className="text-[10px] font-semibold uppercase">
                    {new Date(
                      `${r.reservation_date}T00:00:00`
                    ).toLocaleDateString("es-ES", { month: "short" })}
                  </span>
                  <span className="text-sm font-bold leading-none">
                    {new Date(
                      `${r.reservation_date}T00:00:00`
                    ).getDate()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-xalisco-cream">
                    {r.customer_name}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-xalisco-cream/65">
                    <span>{(r.reservation_time ?? "").slice(0, 5)}</span>
                    <span className="text-xalisco-cream/25">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {r.guests}
                    </span>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusPillClass(r.status)}`}
                >
                  {STATUS_LABEL[r.status ?? ""] ?? r.status ?? "—"}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Desktop: tabla */}
        <div className="mt-4 hidden overflow-x-auto sm:block">
          <table className="min-w-full border-separate border-spacing-0 text-left text-xs">
            <thead className="text-xalisco-cream/60">
              <tr>
                <th className="px-3 py-2 font-medium">Cliente</th>
                <th className="px-3 py-2 font-medium">Personas</th>
                <th className="px-3 py-2 font-medium">Fecha</th>
                <th className="px-3 py-2 font-medium">Hora</th>
                <th className="px-3 py-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-6 text-center text-xalisco-cream/60"
                  >
                    No hay reservas futuras.
                  </td>
                </tr>
              ) : (
                upcoming.map((r, idx) => (
                  <tr
                    key={
                      r.id ??
                      `${r.reservation_date}-${r.reservation_time}-${r.customer_name}`
                    }
                    className={
                      idx % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"
                    }
                  >
                    <td className="px-3 py-2 text-[12px] text-xalisco-cream">
                      {r.customer_name}
                    </td>
                    <td className="px-3 py-2 text-[12px] text-xalisco-cream/80">
                      {r.guests}
                    </td>
                    <td className="px-3 py-2 text-[12px] text-xalisco-cream/80">
                      {new Date(
                        `${r.reservation_date}T00:00:00`
                      ).toLocaleDateString("es-ES")}
                    </td>
                    <td className="px-3 py-2 text-[12px] text-xalisco-cream/80">
                      {(r.reservation_time ?? "").slice(0, 5)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${statusPillClass(r.status)}`}
                      >
                        {STATUS_LABEL[r.status ?? ""] ?? r.status ?? "—"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

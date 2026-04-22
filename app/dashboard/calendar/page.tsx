"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useDashboardAuth } from "@/components/dashboard/DashboardAuthProvider";
import { DashboardModal } from "@/components/dashboard/DashboardModal";
import {
  Calendar,
  Views,
  dateFnsLocalizer,
  type SlotInfo,
  type Event,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addDays, subDays, isSameDay } from "date-fns";
import { es } from "date-fns/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./calendar-theme.css";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Sun,
  Moon,
  Users as UsersIcon,
  Clock,
  MapPin,
  Mail,
  Phone,
  StickyNote,
  Pencil,
} from "lucide-react";

type ReservaEvento = Event & {
  id: string;
  nombre: string;
  personas: number;
  zona: string | null;
  email?: string | null;
  telefono?: string | null;
  notas?: string | null;
  status?: string | null;
};

type BookingHours = {
  comida: { start: string; end: string };
  cena: { start: string; end: string };
};

function timeToMinutes(t: string): number {
  const part = (t || "").trim().slice(0, 5);
  const [h, m] = part.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function isInRange(timeStr: string, start: string, end: string): boolean {
  const min = timeToMinutes(timeStr);
  const s = timeToMinutes(start);
  const e = timeToMinutes(end);
  return min >= s && min < e;
}

const locales = {
  es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const messages = {
  today: "Hoy",
  previous: "Anterior",
  next: "Siguiente",
  month: "Mes",
  week: "Semana",
  day: "Día",
  agenda: "Agenda",
  date: "Fecha",
  time: "Hora",
  event: "Reserva",
  noEventsInRange: "No hay reservas en este rango",
  showMore: (total: number) => `+${total} más`,
};

const defaultHours: BookingHours = {
  comida: { start: "13:00", end: "16:00" },
  cena: { start: "20:00", end: "23:00" },
};

export default function CalendarPage() {
  const { fetchWithAuth } = useDashboardAuth();
  const [view, setView] = useState<typeof Views.DAY | typeof Views.WEEK | typeof Views.MONTH>(
    Views.WEEK
  );
  const [date, setDate] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [bookingHours, setBookingHours] = useState<BookingHours>(defaultHours);
  const [events, setEvents] = useState<ReservaEvento[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"crear" | "editar">("crear");
  const [, setSelectedEvent] = useState<ReservaEvento | null>(null);
  const [, setFormState] = useState({
    nombre: "",
    email: "",
    telefono: "",
    personas: 2,
    fecha: "",
    hora: "",
    zona: "",
    notas: "",
  });
  const [popoverEvent, setPopoverEvent] = useState<ReservaEvento | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const [popoverOpenedByClick, setPopoverOpenedByClick] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const closePopover = useCallback(() => {
    setPopoverEvent(null);
    setPopoverAnchor(null);
    setPopoverOpenedByClick(false);
  }, []);

  useEffect(() => {
    if (!popoverOpenedByClick || !popoverEvent) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        popoverRef.current?.contains(target) ||
        popoverAnchor?.contains(target)
      )
        return;
      closePopover();
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popoverOpenedByClick, popoverEvent, popoverAnchor, closePopover]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [resReservations, resHours] = await Promise.all([
          fetchWithAuth("/api/dashboard/reservations"),
          fetchWithAuth("/api/dashboard/booking-hours"),
        ]);
        const dataRes = await resReservations.json();
        const dataHours = await resHours.json();
        if (resHours.ok && dataHours.comida) {
          setBookingHours({
            comida: dataHours.comida,
            cena: dataHours.cena,
          });
        }
        if (resReservations.ok && Array.isArray(dataRes.reservations)) {
          type ResRow = {
            id: string;
            reservation_date: string;
            reservation_time: string;
            customer_name: string;
            customer_email?: string | null;
            customer_phone?: string | null;
            guests: number;
            notes?: string | null;
            status?: string | null;
            tables?: { name?: string };
          };
          const mapped = dataRes.reservations.map((r: ResRow): ReservaEvento => {
            const start = new Date(`${r.reservation_date}T${r.reservation_time}`);
            const end = new Date(start.getTime() + 30 * 60 * 1000);
            const zona = r.tables?.name ?? null;
            return {
              id: r.id,
              title: zona ? `${r.customer_name} (${r.guests}) · ${zona}` : `${r.customer_name} (${r.guests})`,
              start,
              end,
              nombre: r.customer_name,
              personas: r.guests,
              zona,
              email: r.customer_email ?? null,
              telefono: r.customer_phone ?? null,
              notas: r.notes ?? null,
              status: r.status ?? null,
              allDay: false,
            };
          });
          setEvents(mapped);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const eventsForDay = useMemo(
    () => events.filter((e) => e.start && isSameDay(e.start, selectedDay)),
    [events, selectedDay]
  );
  const comidaReservations = useMemo(
    () =>
      eventsForDay.filter((e) => {
        const t = e.start ? format(e.start, "HH:mm") : "";
        return isInRange(t, bookingHours.comida.start, bookingHours.comida.end);
      }),
    [eventsForDay, bookingHours.comida]
  );
  const cenaReservations = useMemo(
    () =>
      eventsForDay.filter((e) => {
        const t = e.start ? format(e.start, "HH:mm") : "";
        return isInRange(t, bookingHours.cena.start, bookingHours.cena.end);
      }),
    [eventsForDay, bookingHours.cena]
  );

  function openCreateModal(slotInfo: SlotInfo) {
    const start = slotInfo.start as Date;
    const fecha = start.toISOString().slice(0, 10);
    const hora = format(start, "HH:mm");
    setModalMode("crear");
    setSelectedEvent(null);
    setFormState({
      nombre: "",
      email: "",
      telefono: "",
      personas: 2,
      fecha,
      hora,
      zona: "",
      notas: "",
    });
    setModalOpen(true);
  }

  function openEditModal(event: ReservaEvento) {
    closePopover();
    setModalMode("editar");
    setSelectedEvent(event);
    const start = event.start ?? new Date();
    setFormState({
      nombre: event.nombre,
      email: event.email ?? "",
      telefono: event.telefono ?? "",
      personas: event.personas,
      fecha: start.toISOString().slice(0, 10),
      hora: format(start, "HH:mm"),
      zona: event.zona ?? "",
      notas: event.notas ?? "",
    });
    setModalOpen(true);
  }

  const CalendarEventComponent = useCallback(
    (props: { event: ReservaEvento; title?: React.ReactNode; style?: React.CSSProperties; className?: string }) => {
      const { event: ev, title, style, className } = props;
      return (
        <div
          className={className}
          style={style}
          role="button"
          tabIndex={0}
          onMouseEnter={(e) => {
            setPopoverAnchor(e.currentTarget);
            setPopoverEvent(ev);
            setPopoverOpenedByClick(false);
          }}
          onMouseLeave={(e) => {
            if (!popoverOpenedByClick) {
              const toPopover = e.relatedTarget && document.getElementById("reservation-detail-popover")?.contains(e.relatedTarget as Node);
              if (!toPopover) {
                setPopoverEvent(null);
                setPopoverAnchor(null);
              }
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setPopoverAnchor(e.currentTarget as HTMLElement);
              setPopoverEvent(ev);
              setPopoverOpenedByClick(true);
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
            setPopoverAnchor(e.currentTarget);
            setPopoverEvent(ev);
            setPopoverOpenedByClick(true);
          }}
        >
          {title ?? ev.title}
        </div>
      );
    },
    [popoverOpenedByClick]
  );

  function handleEventDrop({
    event,
    start,
    end,
  }: {
    event: ReservaEvento;
    start: Date;
    end: Date;
  }) {
    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === event.id
          ? {
              ...ev,
              start,
              end,
            }
          : ev
      )
    );
  }

  function handleEventResize({
    event,
    start,
    end,
  }: {
    event: ReservaEvento;
    start: Date;
    end: Date;
  }) {
    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === event.id
          ? {
              ...ev,
              start,
              end,
            }
          : ev
      )
    );
  }

  const today = new Date();
  const weekStrip = useMemo(() => {
    const base = subDays(selectedDay, 3);
    return Array.from({ length: 7 }, (_, i) => addDays(base, i));
  }, [selectedDay]);

  const countsByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const ev of events) {
      if (!ev.start) continue;
      const key = format(ev.start, "yyyy-MM-dd");
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [events]);

  // Limitar el rango de horas del calendario al horario real del restaurante
  const calendarBounds = useMemo(() => {
    const [csH = 13, csM = 0] = bookingHours.comida.start.split(":").map(Number);
    const [ceH = 23, ceM = 0] = bookingHours.cena.end.split(":").map(Number);
    const base = new Date();
    base.setSeconds(0, 0);
    const min = new Date(base);
    min.setHours(Math.max(0, csH - 1), csM, 0, 0);
    const max = new Date(base);
    max.setHours(Math.min(23, ceH + 1), ceM, 0, 0);
    if (max.getHours() === 23 && ceH + 1 > 23) max.setHours(23, 59, 0, 0);
    const scroll = new Date(base);
    scroll.setHours(csH, csM, 0, 0);
    return { min, max, scroll };
  }, [bookingHours]);

  const dayStats = useMemo(() => {
    const total = eventsForDay.length;
    const personas = eventsForDay.reduce((acc, e) => acc + (e.personas ?? 0), 0);
    return {
      total,
      personas,
      comida: comidaReservations.length,
      cena: cenaReservations.length,
    };
  }, [eventsForDay, comidaReservations, cenaReservations]);

  function renderReservationRow(ev: ReservaEvento, tone: "comida" | "cena") {
    const color =
      tone === "comida"
        ? "from-amber-400/30 to-amber-500/10 border-amber-400/30"
        : "from-indigo-400/25 to-xalisco-gold/10 border-indigo-400/25";
    const hourColor =
      tone === "comida" ? "text-amber-200" : "text-indigo-200";
    return (
      <li
        key={ev.id}
        onClick={(e) => {
          e.stopPropagation();
          setPopoverAnchor(e.currentTarget);
          setPopoverEvent(ev);
          setPopoverOpenedByClick(true);
        }}
        className={`group relative flex cursor-pointer items-center gap-3 rounded-xl border bg-gradient-to-r ${color} px-3 py-2.5 transition hover:brightness-110 active:scale-[0.99]`}
      >
        <div className="flex min-w-[52px] flex-col items-center justify-center rounded-lg bg-black/30 px-2 py-1.5 text-center">
          <span className={`text-sm font-bold leading-none ${hourColor}`}>
            {ev.start ? format(ev.start, "HH:mm") : "--:--"}
          </span>
          <span className="mt-0.5 text-[9px] uppercase tracking-wider text-xalisco-cream/50">
            {tone}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-xalisco-cream">
            {ev.nombre}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] text-xalisco-cream/70">
            <span className="inline-flex items-center gap-1">
              <UsersIcon className="h-3 w-3" />
              {ev.personas} p
            </span>
            {ev.zona && (
              <span className="inline-flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3" />
                {ev.zona}
              </span>
            )}
            {ev.status && (
              <span
                className={`rounded-full px-1.5 py-[1px] text-[9px] font-medium ${
                  ev.status === "confirmed"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : ev.status === "cancelled"
                      ? "bg-red-500/20 text-red-300"
                      : "bg-amber-500/20 text-amber-300"
                }`}
              >
                {ev.status === "confirmed"
                  ? "Confirmada"
                  : ev.status === "cancelled"
                    ? "Cancelada"
                    : "Pendiente"}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-xalisco-cream/40 transition group-hover:text-xalisco-gold-bright" />
      </li>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-xalisco-cream sm:text-xl">
            Calendario
          </h2>
          <p className="mt-1 text-xs text-xalisco-cream/60">
            Vista diaria con franjas de comida y cena.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            const t = new Date();
            setDate(t);
            setSelectedDay(t);
          }}
          className="inline-flex items-center gap-1.5 self-start rounded-lg border border-white/[0.14] bg-black/20 px-3 py-1.5 text-[11px] font-medium text-xalisco-cream/90 hover:border-xalisco-gold/60 hover:text-xalisco-gold-bright sm:self-auto"
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Hoy
        </button>
      </div>

      {/* Strip de 7 días */}
      <div className="rounded-2xl border border-white/[0.06] bg-xalisco-black-soft/60 p-2">
        <div className="mb-1 flex items-center justify-between px-1.5">
          <button
            type="button"
            onClick={() => {
              const d = subDays(selectedDay, 7);
              setSelectedDay(d);
              setDate(d);
            }}
            className="grid h-7 w-7 place-items-center rounded-md border border-white/[0.12] text-xalisco-cream/80 hover:border-xalisco-gold/50 hover:text-xalisco-gold-bright"
            aria-label="Semana anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-[11px] font-medium text-xalisco-cream/80">
            {format(selectedDay, "MMMM yyyy", { locale: es })}
          </span>
          <button
            type="button"
            onClick={() => {
              const d = addDays(selectedDay, 7);
              setSelectedDay(d);
              setDate(d);
            }}
            className="grid h-7 w-7 place-items-center rounded-md border border-white/[0.12] text-xalisco-cream/80 hover:border-xalisco-gold/50 hover:text-xalisco-gold-bright"
            aria-label="Semana siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weekStrip.map((d) => {
            const isSel = isSameDay(d, selectedDay);
            const isToday = isSameDay(d, today);
            const count = countsByDay.get(format(d, "yyyy-MM-dd")) ?? 0;
            return (
              <button
                key={d.toISOString()}
                type="button"
                onClick={() => {
                  setSelectedDay(d);
                  setDate(d);
                }}
                className={`relative flex flex-col items-center justify-center rounded-xl px-1 py-2 transition ${
                  isSel
                    ? "bg-gradient-to-b from-xalisco-burnt-orange to-xalisco-burnt-orange-hover text-xalisco-black shadow-lg shadow-xalisco-burnt-orange/30"
                    : "bg-black/20 text-xalisco-cream/80 hover:bg-black/30"
                }`}
                aria-label={format(d, "EEEE d MMMM", { locale: es })}
              >
                <span className={`text-[9.5px] uppercase tracking-wider ${isSel ? "text-xalisco-black/70" : "text-xalisco-cream/55"}`}>
                  {format(d, "EEE", { locale: es })}
                </span>
                <span className={`mt-0.5 text-base font-bold leading-none ${isSel ? "" : isToday ? "text-xalisco-gold-bright" : ""}`}>
                  {format(d, "d")}
                </span>
                {count > 0 && (
                  <span
                    className={`mt-1 grid h-4 min-w-[16px] place-items-center rounded-full px-1 text-[9px] font-semibold ${
                      isSel
                        ? "bg-xalisco-black/80 text-xalisco-gold-bright"
                        : "bg-xalisco-burnt-orange/30 text-xalisco-burnt-orange"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Día seleccionado + stats */}
      <div className="rounded-2xl border border-white/[0.06] bg-xalisco-black-soft/60 p-3">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              const d = subDays(selectedDay, 1);
              setSelectedDay(d);
              setDate(d);
            }}
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/[0.12] text-xalisco-cream/85 hover:border-xalisco-gold/50 hover:text-xalisco-gold-bright"
            aria-label="Día anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-sm font-semibold text-xalisco-cream sm:text-base">
              {format(selectedDay, "EEEE d 'de' MMMM", { locale: es })}
            </p>
            <p className="text-[10.5px] text-xalisco-cream/55">
              {format(selectedDay, "yyyy")}
              {isSameDay(selectedDay, today) && (
                <span className="ml-1.5 rounded-full bg-xalisco-gold/20 px-1.5 py-[1px] text-[9px] font-semibold uppercase tracking-wider text-xalisco-gold-bright">
                  Hoy
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const d = addDays(selectedDay, 1);
              setSelectedDay(d);
              setDate(d);
            }}
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/[0.12] text-xalisco-cream/85 hover:border-xalisco-gold/50 hover:text-xalisco-gold-bright"
            aria-label="Día siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {[
            { label: "Reservas", value: dayStats.total, icon: CalendarDays, tone: "text-xalisco-gold-bright" },
            { label: "Personas", value: dayStats.personas, icon: UsersIcon, tone: "text-xalisco-cream" },
            { label: "Comida", value: dayStats.comida, icon: Sun, tone: "text-amber-300" },
            { label: "Cena", value: dayStats.cena, icon: Moon, tone: "text-indigo-300" },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center rounded-lg border border-white/[0.06] bg-black/25 px-1.5 py-2 text-center"
            >
              <s.icon className={`h-4 w-4 ${s.tone}`} />
              <span className="mt-0.5 text-base font-bold text-xalisco-cream">
                {s.value}
              </span>
              <span className="text-[9.5px] uppercase tracking-wider text-xalisco-cream/55">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Comida y Cena con timeline */}
      <div className="grid gap-3 sm:grid-cols-2">
        <section className="rounded-2xl border border-white/[0.06] bg-xalisco-black-soft/60 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-400/15 text-amber-300">
                <Sun className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-xalisco-cream">
                  Comida
                </h3>
                <p className="text-[10.5px] text-xalisco-cream/55">
                  {bookingHours.comida.start} – {bookingHours.comida.end}
                </p>
              </div>
            </div>
            <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
              {comidaReservations.length}
            </span>
          </div>
          <ul className="mt-3 space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {comidaReservations.length === 0 ? (
              <li className="rounded-lg border border-dashed border-white/[0.08] px-3 py-4 text-center text-[11px] text-xalisco-cream/50">
                Sin reservas para la comida
              </li>
            ) : (
              comidaReservations
                .sort((a, b) => (a.start! > b.start! ? 1 : -1))
                .map((ev) => renderReservationRow(ev, "comida"))
            )}
          </ul>
        </section>
        <section className="rounded-2xl border border-white/[0.06] bg-xalisco-black-soft/60 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-400/15 text-indigo-300">
                <Moon className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-xalisco-cream">
                  Cena
                </h3>
                <p className="text-[10.5px] text-xalisco-cream/55">
                  {bookingHours.cena.start} – {bookingHours.cena.end}
                </p>
              </div>
            </div>
            <span className="rounded-full border border-indigo-400/30 bg-indigo-400/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-200">
              {cenaReservations.length}
            </span>
          </div>
          <ul className="mt-3 space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {cenaReservations.length === 0 ? (
              <li className="rounded-lg border border-dashed border-white/[0.08] px-3 py-4 text-center text-[11px] text-xalisco-cream/50">
                Sin reservas para la cena
              </li>
            ) : (
              cenaReservations
                .sort((a, b) => (a.start! > b.start! ? 1 : -1))
                .map((ev) => renderReservationRow(ev, "cena"))
            )}
          </ul>
        </section>
      </div>

      {/* Calendario semanal (solo desktop) */}
      <div className="calendar-dark hidden overflow-hidden rounded-2xl border border-white/[0.06] bg-xalisco-black-soft/60 p-4 md:block">
        {loading ? (
          <p className="text-xs text-xalisco-cream/60">
            Cargando reservas...
          </p>
        ) : (
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            defaultView={Views.WEEK}
            view={view}
            onView={(v: string) => setView(v as typeof Views.DAY | typeof Views.WEEK | typeof Views.MONTH)}
            date={date}
            onNavigate={(d: Date) => {
              setDate(d);
              setSelectedDay(d);
            }}
            messages={messages}
            selectable
            resizable
            min={calendarBounds.min}
            max={calendarBounds.max}
            scrollToTime={calendarBounds.scroll}
            step={30}
            timeslots={2}
            style={{ height: "calc(100vh - 18rem)", minHeight: 560 }}
            onSelectSlot={openCreateModal}
            onSelectEvent={(e: ReservaEvento) => {
              setPopoverEvent(e);
              setPopoverAnchor(null);
              setPopoverOpenedByClick(true);
            }}
            components={{ event: CalendarEventComponent as React.ComponentType<{ event: ReservaEvento; title?: React.ReactNode; style?: React.CSSProperties; className?: string }> }}
            onEventDrop={handleEventDrop}
            onEventResize={handleEventResize}
            popup
            eventPropGetter={(_event: ReservaEvento, _start: Date, _end: Date, isSelected: boolean) => ({
              className: "",
              style: {
                background: isSelected
                  ? "linear-gradient(135deg, #f47d4f, #f5c87a)"
                  : "linear-gradient(135deg, rgba(232,108,62,0.9), rgba(207,162,96,0.8))",
                borderRadius: "6px",
                color: "#1a110d",
                border: "1px solid rgba(245,200,122,0.35)",
                fontSize: "11px",
                fontWeight: 500,
                padding: "2px 6px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
              },
            })}
          />
        )}
      </div>

      {/* Popover de detalles al pasar el ratón o al hacer clic */}
      {popoverEvent &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            {/* Backdrop solo en móvil */}
            {popoverOpenedByClick && (
              <div
                className="fixed inset-0 z-[95] bg-black/60 backdrop-blur-[2px] md:hidden"
                onClick={closePopover}
                aria-hidden
              />
            )}
            <div
              id="reservation-detail-popover"
              ref={popoverRef}
              className="fixed z-[100] w-[min(92vw,320px)] overflow-hidden rounded-2xl border border-white/[0.12] bg-xalisco-black-soft shadow-2xl shadow-black/60"
              onMouseLeave={() => {
                if (popoverOpenedByClick) return;
                setPopoverEvent(null);
                setPopoverAnchor(null);
              }}
              style={(() => {
                const isMobile =
                  typeof window !== "undefined" && window.innerWidth < 768;
                if (isMobile || !popoverAnchor) {
                  return {
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                  };
                }
                const rect = popoverAnchor.getBoundingClientRect();
                const vh =
                  typeof window !== "undefined" ? window.innerHeight : 800;
                const top =
                  rect.bottom + 280 > vh ? rect.top - 280 : rect.bottom + 8;
                return {
                  left: Math.min(
                    Math.max(8, rect.left),
                    (typeof window !== "undefined" ? window.innerWidth : 1200) - 332
                  ),
                  top: Math.max(8, top),
                };
              })()}
            >
              <div className="bg-gradient-to-br from-xalisco-burnt-orange/30 to-xalisco-gold/10 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-xalisco-cream">
                      {popoverEvent.nombre}
                    </p>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-xalisco-cream/75">
                      <Clock className="h-3 w-3" />
                      {popoverEvent.start
                        ? format(popoverEvent.start, "EEE d MMM · HH:mm", {
                            locale: es,
                          })
                        : "—"}
                    </p>
                  </div>
                  {popoverEvent.status && (
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        popoverEvent.status === "confirmed"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : popoverEvent.status === "cancelled"
                            ? "bg-red-500/20 text-red-300"
                            : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {popoverEvent.status === "confirmed"
                        ? "Confirmada"
                        : popoverEvent.status === "cancelled"
                          ? "Cancelada"
                          : "Pendiente"}
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-2 p-4 text-[12px] text-xalisco-cream/85">
                <div className="flex items-center gap-2">
                  <UsersIcon className="h-3.5 w-3.5 text-xalisco-cream/55" />
                  <span>{popoverEvent.personas} personas</span>
                </div>
                {popoverEvent.zona && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-xalisco-cream/55" />
                    <span>{popoverEvent.zona}</span>
                  </div>
                )}
                {popoverEvent.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-xalisco-cream/55" />
                    <span className="truncate">{popoverEvent.email}</span>
                  </div>
                )}
                {popoverEvent.telefono && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-xalisco-cream/55" />
                    <span>{popoverEvent.telefono}</span>
                  </div>
                )}
                {popoverEvent.notas && (
                  <div className="flex items-start gap-2 border-t border-white/[0.06] pt-2">
                    <StickyNote className="mt-0.5 h-3.5 w-3.5 text-xalisco-cream/55" />
                    <span className="text-xalisco-cream/75">
                      {popoverEvent.notas}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(popoverEvent)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-xalisco-gold/40 bg-xalisco-gold/10 px-3 py-2 text-xs font-medium text-xalisco-gold-bright hover:bg-xalisco-gold/20"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={closePopover}
                    className="rounded-lg border border-white/[0.14] px-3 py-2 text-xs text-xalisco-cream/80 hover:border-white/30"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </>,
          document.body
        )}

      <DashboardModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalMode === "crear" ? "Nueva reserva" : "Editar reserva"}
        size="lg"
      >
        <p className="text-xs text-xalisco-cream/70">
          Puedes gestionar esta reserva desde la página de Reservas.
        </p>
      </DashboardModal>
    </div>
  );
}


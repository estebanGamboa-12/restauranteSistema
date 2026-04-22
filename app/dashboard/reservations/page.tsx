"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Filter,
  MessageCircle,
  Pencil,
  Trash2,
  Users as UsersIcon,
  Clock,
  MapPin,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useDashboardAuth } from "@/components/dashboard/DashboardAuthProvider";
import { DashboardModal } from "@/components/dashboard/DashboardModal";
import { ConfirmModal } from "@/components/dashboard/ConfirmModal";
import {
  buildWhatsappLink,
  DEFAULT_MESSAGE_TEMPLATES,
  renderMessageTemplate,
  type MessageTemplate,
} from "@/lib/message-templates";

type ReservationStatus = "pending" | "confirmed" | "cancelled" | "completed";

type ReservationRow = {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  guests: number;
  reservation_date: string;
  reservation_time: string;
  table_name: string | null;
  status: ReservationStatus;
  deposit_paid?: boolean;
  deposit_amount?: number;
  refund_status?: string | null;
  refunded_at?: string | null;
};

const STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
};

type BookingHours = {
  comida: { start: string; end: string };
  cena: { start: string; end: string };
  slot_interval_minutes: number;
};

function timeToMinutes(t: string): number {
  const part = (t || "").trim().slice(0, 5);
  const [h, m] = part.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function minutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function buildTimeSlots(
  startStr: string,
  endStr: string,
  intervalMinutes: number
): string[] {
  const start = timeToMinutes(startStr);
  const end = timeToMinutes(endStr);
  const slots: string[] = [];
  for (let min = start; min < end; min += intervalMinutes) {
    slots.push(minutesToTime(min));
  }
  return slots;
}

function inferMealType(
  timeStr: string,
  comida: { start: string; end: string },
  cena: { start: string; end: string }
): "comida" | "cena" {
  const min = timeToMinutes(timeStr);
  const comidaStart = timeToMinutes(comida.start);
  const comidaEnd = timeToMinutes(comida.end);
  const cenaStart = timeToMinutes(cena.start);
  const cenaEnd = timeToMinutes(cena.end);
  if (min >= comidaStart && min < comidaEnd) return "comida";
  if (min >= cenaStart && min < cenaEnd) return "cena";
  return min < 15 * 60 ? "cena" : "comida";
}

function getTodayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getNowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function filterSlotsForToday(slots: string[], nowMinutes: number): string[] {
  return slots.filter((slot) => timeToMinutes(slot) > nowMinutes);
}

export default function ReservationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "all">(
    "all"
  );
  const [dateFilter, setDateFilter] = useState<string>("");
  const [sortField, setSortField] = useState<"reservation_date" | "reservation_time">(
    "reservation_date"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"crear" | "editar">("crear");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    nombre: "",
    email: "",
    telefono: "",
    personas: 2,
    fecha: "",
    hora: "",
    mealType: "" as "" | "comida" | "cena",
    mesaId: "",
    notas: "",
  });
  const [tables, setTables] = useState<{ id: string; name: string }[]>([]);
  const [bookingHours, setBookingHours] = useState<BookingHours | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<MessageTemplate[]>(
    DEFAULT_MESSAGE_TEMPLATES
  );
  const [restaurantName, setRestaurantName] = useState<string>("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { showToast } = useToast();
  const { fetchWithAuth, can } = useDashboardAuth();

  useEffect(() => {
    async function loadMeta() {
      try {
        const [tplRes, settingsRes] = await Promise.all([
          fetchWithAuth("/api/dashboard/message-templates"),
          fetchWithAuth("/api/dashboard/settings"),
        ]);
        if (tplRes.ok) {
          const d = await tplRes.json();
          if (Array.isArray(d.templates) && d.templates.length > 0) {
            setTemplates(d.templates);
          }
        }
        if (settingsRes.ok) {
          const d = await settingsRes.json();
          setRestaurantName(d.restaurant?.name ?? "");
        }
      } catch {
        // ignore
      }
    }
    void loadMeta();
  }, [fetchWithAuth]);

  function openWhatsappFor(r: ReservationRow) {
    if (!r.customer_phone) {
      showToast({
        type: "error",
        message: "Este cliente no tiene teléfono.",
      });
      return;
    }
    const tpl =
      templates.find((t) => t.key === "reservation_reminder") ??
      DEFAULT_MESSAGE_TEMPLATES[0];
    const text = renderMessageTemplate(tpl.body, {
      customerName: r.customer_name,
      restaurantName,
      reservationDate: new Date(
        `${r.reservation_date}T00:00:00`
      ).toLocaleDateString("es-ES"),
      reservationTime: (r.reservation_time ?? "").slice(0, 5),
      guests: r.guests,
    });
    const url = buildWhatsappLink(r.customer_phone, text);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const defaultBookingHours: BookingHours = {
    comida: { start: "13:00", end: "16:00" },
    cena: { start: "20:00", end: "23:00" },
    slot_interval_minutes: 15,
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [resRes, resTables, resHours] = await Promise.all([
          fetchWithAuth("/api/dashboard/reservations"),
          fetchWithAuth("/api/dashboard/tables"),
          fetchWithAuth("/api/dashboard/booking-hours"),
        ]);
        const dataRes = await resRes.json();
        const dataTables = await resTables.json();
        const dataHours = await resHours.json();
        type TableRow = { id: string; name: string };
        type ResApiRow = {
          id: string;
          customer_name: string;
          customer_email: string | null;
          customer_phone: string | null;
          guests: number;
          reservation_date: string;
          reservation_time: string;
          tables?: { name?: string };
          status: string;
          deposit_paid?: boolean;
          deposit_amount?: number;
          refund_status?: string | null;
          refunded_at?: string | null;
        };
        if (resTables.ok && Array.isArray(dataTables.tables)) {
          setTables(
            (dataTables.tables as TableRow[]).map((t) => ({
              id: t.id,
              name: t.name,
            }))
          );
        }
        if (resRes.ok && Array.isArray(dataRes.reservations)) {
          setReservations(
            (dataRes.reservations as ResApiRow[]).map((r) => ({
              id: r.id,
              customer_name: r.customer_name,
              customer_email: r.customer_email ?? null,
              customer_phone: r.customer_phone ?? null,
              guests: r.guests,
              reservation_date: r.reservation_date,
              reservation_time: r.reservation_time,
              table_name: r.tables?.name ?? null,
              status: r.status as ReservationStatus,
              deposit_paid: !!r.deposit_paid,
              deposit_amount: Number(r.deposit_amount ?? 0),
              refund_status: r.refund_status ?? null,
              refunded_at: r.refunded_at ?? null,
            }))
          );
        }
        if (resHours.ok && dataHours.comida) {
          setBookingHours({
            comida: dataHours.comida,
            cena: dataHours.cena,
            slot_interval_minutes: dataHours.slot_interval_minutes ?? 15,
          });
        }
      } catch {
        // silencio
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return reservations
      .filter((r) => (statusFilter === "all" ? true : r.status === statusFilter))
      .filter((r) => (dateFilter ? r.reservation_date === dateFilter : true))
      .filter(
        (r) =>
          !q ||
          (r.customer_name || "").toLowerCase().includes(q) ||
          (r.customer_email || "").toLowerCase().includes(q) ||
          (r.customer_phone || "").replace(/\s/g, "").includes(q.replace(/\s/g, ""))
      )
      .sort((a, b) => {
        const field = sortField;
        const aVal = a[field];
        const bVal = b[field];
        if (aVal === bVal) return 0;
        const res = aVal < bVal ? -1 : 1;
        return sortDirection === "asc" ? res : -res;
      });
  }, [reservations, statusFilter, dateFilter, searchQuery, sortField, sortDirection]);

  function toggleSort(field: "reservation_date" | "reservation_time") {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }

  const timeSlots = useMemo(() => {
    if (!formState.mealType) return [];
    const hours = bookingHours ?? defaultBookingHours;
    const range =
      formState.mealType === "comida" ? hours.comida : hours.cena;
    const all = buildTimeSlots(
      range.start,
      range.end,
      hours.slot_interval_minutes
    );
    const today = getTodayLocal();
    if (formState.fecha && formState.fecha === today) {
      return filterSlotsForToday(all, getNowMinutes());
    }
    return all;
  }, [bookingHours, formState.mealType, formState.fecha]);

  function openCreateModal() {
    setModalMode("crear");
    setSelectedId(null);
    setFormState({
      nombre: "",
      email: "",
      telefono: "",
      personas: 2,
      fecha: "",
      hora: "",
      mealType: "",
      mesaId: tables[0]?.id ?? "",
      notas: "",
    });
    setFeedback(null);
    setModalOpen(true);
  }

  function openEditModal(row: ReservationRow) {
    setModalMode("editar");
    setSelectedId(row.id);
    const hours = bookingHours ?? defaultBookingHours;
    const mealType = inferMealType(
      row.reservation_time,
      hours.comida,
      hours.cena
    );
    const horaNorm = (row.reservation_time || "").trim().slice(0, 5) || row.reservation_time;
    const today = getTodayLocal();
    const isToday = row.reservation_date === today;
    const nowMin = getNowMinutes();
    const horaInPast = isToday && timeToMinutes(horaNorm) <= nowMin;
    setFormState({
      nombre: row.customer_name,
      email: row.customer_email ?? "",
      telefono: row.customer_phone ?? "",
      personas: row.guests,
      fecha: row.reservation_date,
      hora: horaInPast ? "" : horaNorm,
      mealType,
      mesaId: tables.find((t) => t.name === row.table_name)?.id ?? "",
      notas: "",
    });
    setFeedback(null);
    setModalOpen(true);
  }

  async function handleDelete(id: string) {
    setDeleteId(null);
    try {
      const res = await fetchWithAuth(`/api/dashboard/reservations/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({
          type: "error",
          message: data.error ?? "Error del servidor",
        });
        return;
      }
      setReservations((prev) => prev.filter((r) => r.id !== id));
      showToast({
        type: "success",
        message: "Reserva eliminada",
      });
    } catch {
      showToast({
        type: "error",
        message: "Error del servidor",
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formState.mealType && !formState.hora) {
      setFeedback("Elige una hora en la cuadrícula.");
      return;
    }
    setSaving(true);
    setFeedback(null);

    const payload = {
      nombre: formState.nombre,
      email: formState.email,
      telefono: formState.telefono,
      personas: formState.personas,
      fecha: formState.fecha,
      hora: formState.hora,
      mesaId: formState.mesaId,
      notas: formState.notas,
    };

    try {
      const url =
        modalMode === "crear"
          ? "/api/dashboard/reservations"
          : `/api/dashboard/reservations/${selectedId}`;
      const method = modalMode === "crear" ? "POST" : "PUT";
      const res = await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback(data.error ?? "Datos inválidos");
        showToast({
          type: "error",
          message: data.error ?? "Datos inválidos",
        });
        return;
      }
      const successMessage =
        data.message ??
        (modalMode === "crear"
          ? "Reserva creada correctamente"
          : "Reserva actualizada");
      setFeedback(successMessage);
      showToast({
        type: "success",
        message: successMessage,
      });
      const resList = await fetchWithAuth("/api/dashboard/reservations");
      const dataList = await resList.json();
      if (resList.ok && Array.isArray(dataList.reservations)) {
        type ResApiRow = { id: string; customer_name: string; customer_email: string | null; customer_phone: string | null; guests: number; reservation_date: string; reservation_time: string; tables?: { name?: string }; status: string };
        setReservations(
          (dataList.reservations as ResApiRow[]).map((r) => ({
            id: r.id,
            customer_name: r.customer_name,
            customer_email: r.customer_email ?? null,
            customer_phone: r.customer_phone ?? null,
            guests: r.guests,
            reservation_date: r.reservation_date,
            reservation_time: r.reservation_time,
            table_name: r.tables?.name ?? null,
            status: r.status as ReservationStatus,
          }))
        );
      }
    } catch {
      const msg =
        modalMode === "crear"
          ? "No se pudo guardar"
          : "No se pudo guardar";
      setFeedback(msg);
      showToast({
        type: "error",
        message: msg,
      });
    } finally {
      setSaving(false);
    }
  }

  const activeFiltersCount =
    (dateFilter ? 1 : 0) + (statusFilter !== "all" ? 1 : 0);

  return (
    <div className="flex min-h-0 min-w-0 w-full max-w-full flex-col overflow-x-hidden">
      {/* Header */}
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-xalisco-cream sm:text-2xl">
            Reservas
          </h2>
          <p className="mt-1 text-xs text-xalisco-cream/60">
            {filtered.length}{" "}
            {filtered.length === 1 ? "reserva" : "reservas"}
            {activeFiltersCount > 0 && " con filtros aplicados"}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="hidden shrink-0 items-center gap-1.5 self-start rounded-lg bg-xalisco-burnt-orange px-4 py-2 text-xs font-semibold text-xalisco-black shadow-lg shadow-xalisco-burnt-orange/20 transition-colors hover:bg-xalisco-burnt-orange-hover sm:inline-flex"
        >
          <Plus className="h-4 w-4" />
          Nueva reserva
        </button>
      </div>

      {/* Buscador + toggle filtros */}
      <div className="mt-4 flex shrink-0 items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-xalisco-cream/40" />
          <input
            type="search"
            placeholder="Nombre, email o teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[color:var(--xalisco-border)] bg-black/20 py-2.5 pl-9 pr-3 text-xs text-xalisco-cream outline-none placeholder:text-xalisco-cream/40 focus:border-xalisco-burnt-orange/60"
            aria-label="Buscar reservas"
          />
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className={`relative shrink-0 rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors ${
            filtersOpen || activeFiltersCount > 0
              ? "border-xalisco-burnt-orange/60 bg-xalisco-burnt-orange/10 text-xalisco-burnt-orange"
              : "border-[color:var(--xalisco-border)] bg-black/20 text-xalisco-cream/80 hover:text-xalisco-cream"
          }`}
          aria-label="Filtros"
        >
          <Filter className="h-4 w-4" />
          {activeFiltersCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-xalisco-burnt-orange px-1 text-[9px] font-bold text-xalisco-black">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Filtros colapsables */}
      {filtersOpen && (
        <div className="mt-2 flex shrink-0 flex-wrap items-end gap-3 rounded-lg border border-[color:var(--xalisco-border)] bg-black/20 p-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-xalisco-muted">
              Fecha
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-md border border-[color:var(--xalisco-border)] bg-black/30 px-2.5 py-2 text-xs text-xalisco-cream outline-none"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-xalisco-muted">
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as ReservationStatus | "all")
              }
              className="rounded-md border border-[color:var(--xalisco-border)] bg-black/30 px-2.5 py-2 text-xs text-xalisco-cream outline-none"
            >
              <option value="all">Todos</option>
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmada</option>
              <option value="cancelled">Cancelada</option>
              <option value="completed">Completada</option>
            </select>
          </div>
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setDateFilter("");
                setStatusFilter("all");
              }}
              className="shrink-0 rounded-md border border-[color:var(--xalisco-border)] bg-black/30 px-3 py-2 text-xs text-xalisco-cream/80 hover:text-xalisco-cream"
            >
              Limpiar
            </button>
          )}
        </div>
      )}

      {/* Mobile: cards */}
      <div className="mt-3 flex-1 space-y-2 sm:hidden">
        {loading && (
          <p className="rounded-xl bg-white/[0.02] py-8 text-center text-xs text-xalisco-cream/60">
            Cargando reservas...
          </p>
        )}
        {!loading && filtered.length === 0 && (
          <p className="rounded-xl bg-white/[0.02] py-8 text-center text-xs text-xalisco-cream/50">
            No hay reservas.
          </p>
        )}
        {!loading &&
          filtered.map((r) => (
            <div
              key={r.id}
              className="overflow-hidden rounded-xl border border-[color:var(--xalisco-border)] bg-xalisco-black-soft/60"
            >
              <div className="flex items-start gap-3 p-3">
                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-xalisco-burnt-orange/15 text-xalisco-burnt-orange">
                  <span className="text-[10px] font-semibold uppercase">
                    {new Date(
                      `${r.reservation_date}T00:00:00`
                    ).toLocaleDateString("es-ES", { month: "short" })}
                  </span>
                  <span className="text-base font-bold leading-none">
                    {new Date(`${r.reservation_date}T00:00:00`).getDate()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-xalisco-cream">
                        {r.customer_name}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-xalisco-cream/65">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {(r.reservation_time ?? "").slice(0, 5)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <UsersIcon className="h-3 w-3" />
                          {r.guests}
                        </span>
                        {r.table_name && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {r.table_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 ${cnStatusPill(r.status)}`}
                    >
                      {STATUS_LABEL[r.status]}
                    </span>
                  </div>
                  {(r.customer_email || r.customer_phone) && (
                    <div className="mt-1.5 flex flex-wrap gap-x-2 text-[11px] text-xalisco-cream/55">
                      {r.customer_phone && <span>{r.customer_phone}</span>}
                      {r.customer_phone && r.customer_email && (
                        <span className="text-xalisco-cream/20">·</span>
                      )}
                      {r.customer_email && (
                        <span className="truncate">{r.customer_email}</span>
                      )}
                    </div>
                  )}
                  {r.deposit_paid && (
                    <div className="mt-1.5 text-[10px] text-emerald-300/80">
                      Depósito {((r.deposit_amount ?? 0) / 100).toFixed(2)} €
                      pagado
                      {r.refund_status === "processed" && " · devuelto"}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-stretch divide-x divide-[color:var(--xalisco-border)] border-t border-[color:var(--xalisco-border)] text-[11px]">
                {r.customer_phone && (
                  <button
                    type="button"
                    onClick={() => openWhatsappFor(r)}
                    className="flex flex-1 items-center justify-center gap-1.5 py-2.5 font-medium text-emerald-300 hover:bg-emerald-500/5"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    WhatsApp
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openEditModal(r)}
                  className="flex flex-1 items-center justify-center gap-1.5 py-2.5 font-medium text-xalisco-cream/85 hover:bg-white/5"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </button>
                {can("reservations_delete") && (
                  <button
                    type="button"
                    onClick={() => setDeleteId(r.id)}
                    className="flex flex-1 items-center justify-center gap-1.5 py-2.5 font-medium text-red-300 hover:bg-red-500/5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Borrar
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* Desktop: tabla */}
      <div className="mt-3 hidden min-h-[280px] min-w-0 flex-1 overflow-auto rounded-xl border border-[color:var(--xalisco-border)] bg-xalisco-black-soft/60 sm:block max-h-[calc(100vh-16rem)]">
        <table className="w-full min-w-[820px] border-separate border-spacing-0 text-left text-xs">
          <thead className="sticky top-0 z-10 bg-xalisco-black-soft/95 text-xalisco-cream/70 backdrop-blur">
            <tr>
              <th className="px-3 py-2.5 font-medium">Cliente</th>
              <th className="px-3 py-2.5 font-medium">Contacto</th>
              <th className="px-3 py-2.5 font-medium">Personas</th>
              <th
                className="cursor-pointer select-none px-3 py-2.5 font-medium"
                onClick={() => toggleSort("reservation_date")}
              >
                Fecha
                {sortField === "reservation_date" && (
                  <span className="ml-1 text-[10px]">
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </th>
              <th
                className="cursor-pointer select-none px-3 py-2.5 font-medium"
                onClick={() => toggleSort("reservation_time")}
              >
                Hora
                {sortField === "reservation_time" && (
                  <span className="ml-1 text-[10px]">
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </th>
              <th className="px-3 py-2.5 font-medium">Depósito</th>
              <th className="px-3 py-2.5 font-medium">Zona</th>
              <th className="px-3 py-2.5 font-medium">Estado</th>
              <th className="px-3 py-2.5 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-8 text-center text-xalisco-cream/60"
                >
                  Cargando reservas...
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-8 text-center text-xalisco-cream/50"
                >
                  No hay reservas.
                </td>
              </tr>
            )}
            {filtered.map((r, idx) => (
              <tr
                key={r.id}
                className={
                  idx % 2 === 0
                    ? "bg-transparent hover:bg-white/[0.02]"
                    : "bg-white/[0.02] hover:bg-white/[0.04]"
                }
              >
                <td className="px-3 py-2 text-[12px] font-medium text-xalisco-cream">
                  {r.customer_name}
                </td>
                <td className="px-3 py-2 text-[11px] text-xalisco-cream/75">
                  <div className="flex flex-col">
                    {r.customer_phone && <span>{r.customer_phone}</span>}
                    {r.customer_email && (
                      <span className="truncate text-xalisco-cream/55">
                        {r.customer_email}
                      </span>
                    )}
                  </div>
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
                <td className="px-3 py-2 text-[11px] text-xalisco-cream/75">
                  {r.deposit_paid ? (
                    <div className="flex flex-col">
                      <span className="font-medium text-emerald-300">
                        {((r.deposit_amount ?? 0) / 100).toFixed(2)} €
                      </span>
                      {r.refund_status === "processed" && (
                        <span className="text-[10px] text-xalisco-muted">
                          Devuelto
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xalisco-cream/40">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-[12px] text-xalisco-cream/80">
                  {r.table_name ?? "—"}
                </td>
                <td className="px-3 py-2">
                  <span className={cnStatusPill(r.status)}>
                    {STATUS_LABEL[r.status]}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="inline-flex items-center gap-1">
                    {r.customer_phone && (
                      <button
                        type="button"
                        title="Abrir WhatsApp"
                        onClick={() => openWhatsappFor(r)}
                        className="rounded-md border border-emerald-400/40 p-1.5 text-emerald-300 hover:bg-emerald-500/10"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      title="Editar"
                      onClick={() => openEditModal(r)}
                      className="rounded-md border border-[color:var(--xalisco-border)] p-1.5 text-xalisco-cream/80 hover:border-xalisco-burnt-orange/60 hover:text-xalisco-burnt-orange"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {can("reservations_delete") && (
                      <button
                        type="button"
                        title="Eliminar"
                        onClick={() => setDeleteId(r.id)}
                        className="rounded-md border border-red-500/60 p-1.5 text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FAB móvil */}
      <button
        type="button"
        onClick={openCreateModal}
        aria-label="Nueva reserva"
        className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] right-4 z-20 inline-flex h-14 w-14 items-center justify-center rounded-full bg-xalisco-burnt-orange text-xalisco-black shadow-[0_12px_30px_rgba(232,108,62,0.45)] transition-transform hover:scale-105 active:scale-95 sm:hidden"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>
      <DashboardModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalMode === "crear" ? "Nueva reserva" : "Editar reserva"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="grid gap-3 text-xs">
              <div className="flex flex-col">
                <label className="mb-1 text-xalisco-cream/80">Nombre</label>
                <input
                  type="text"
                  value={formState.nombre}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, nombre: e.target.value }))
                  }
                  className="rounded-md border border-white/[0.12] bg-transparent px-2 py-1 text-[11px] text-xalisco-cream outline-none"
                  required
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-3">
                <div className="flex flex-1 flex-col">
                  <label className="mb-1 text-xalisco-cream/80">Email</label>
                  <input
                    type="email"
                    value={formState.email}
                    onChange={(e) =>
                      setFormState((s) => ({ ...s, email: e.target.value }))
                    }
                    className="rounded-md border border-white/[0.12] bg-transparent px-2 py-1 text-[11px] text-xalisco-cream outline-none"
                  />
                </div>
                <div className="mt-3 flex flex-1 flex-col sm:mt-0">
                  <label className="mb-1 text-xalisco-cream/80">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formState.telefono}
                    onChange={(e) =>
                      setFormState((s) => ({ ...s, telefono: e.target.value }))
                    }
                    className="rounded-md border border-white/[0.12] bg-transparent px-2 py-1 text-[11px] text-xalisco-cream outline-none"
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex flex-col">
                  <label className="mb-1 text-xalisco-cream/80">
                    Personas
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={formState.personas}
                    onChange={(e) =>
                      setFormState((s) => ({
                        ...s,
                        personas: Number(e.target.value),
                      }))
                    }
                    className="rounded-md border border-white/[0.12] bg-transparent px-2 py-1 text-[11px] text-xalisco-cream outline-none"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-xalisco-cream/80">Fecha</label>
                  <input
                    type="date"
                    value={formState.fecha}
                    onChange={(e) =>
                      setFormState((s) => ({ ...s, fecha: e.target.value }))
                    }
                    className="rounded-md border border-white/[0.12] bg-transparent px-2 py-1 text-[11px] text-xalisco-cream outline-none"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1 text-xalisco-cream/80">
                    Comida o cena
                  </label>
                  <select
                    value={formState.mealType}
                    onChange={(e) =>
                      setFormState((s) => ({
                        ...s,
                        mealType: e.target.value as "" | "comida" | "cena",
                        hora: "",
                      }))
                    }
                    className="rounded-md border border-white/[0.12] bg-transparent px-2 py-1 text-[11px] text-xalisco-cream outline-none"
                    required
                  >
                    <option value="">Seleccionar</option>
                    <option value="comida">Comida</option>
                    <option value="cena">Cena</option>
                  </select>
                </div>
              </div>

              {formState.mealType && timeSlots.length > 0 && (
                <div className="flex flex-col">
                  <label className="mb-2 text-xalisco-cream/80">
                    Hora ({formState.mealType === "comida" ? "comida" : "cena"})
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-40 overflow-y-auto rounded-lg border border-white/[0.08] bg-white/[0.02] p-2">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() =>
                          setFormState((s) => ({ ...s, hora: slot }))
                        }
                        className={`rounded-md px-3 py-2 text-[11px] font-medium transition-colors ${
                          formState.hora === slot
                            ? "bg-xalisco-burnt-orange text-xalisco-black"
                            : "bg-white/[0.06] text-xalisco-cream/90 hover:bg-white/[0.12] border border-white/[0.08]"
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                  {!formState.hora && (
                    <p className="mt-1 text-[10px] text-xalisco-cream/50">
                      Elige una hora
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-col">
                <label className="mb-1 text-xalisco-cream/80">Zona</label>
                <select
                  value={formState.mesaId}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, mesaId: e.target.value }))
                  }
                  className="rounded-md border border-white/[0.12] bg-transparent px-2 py-1 text-[11px] text-xalisco-cream outline-none"
                  required
                >
                  <option value="">Seleccionar zona</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="mb-1 text-xalisco-cream/80">Notas</label>
                <textarea
                  rows={3}
                  value={formState.notas}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, notas: e.target.value }))
                  }
                  className="resize-none rounded-md border border-white/[0.12] bg-transparent px-2 py-1 text-[11px] text-xalisco-cream outline-none"
                />
              </div>
              {feedback && (
                <p className="text-[11px] text-xalisco-cream/80">{feedback}</p>
              )}
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-md border border-white/[0.2] px-3 py-1.5 text-[11px] text-xalisco-cream/80 hover:border-xalisco-gold/60"
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-xalisco-burnt-orange px-3 py-1.5 text-[11px] font-medium text-xalisco-black hover:bg-xalisco-burnt-orange-hover disabled:opacity-60"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
      </DashboardModal>

      <ConfirmModal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="¿Eliminar reserva?"
        message="Esta reserva se eliminará de la lista. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </div>
  );
}

function cnStatusPill(status: ReservationStatus) {
  switch (status) {
    case "pending":
      return "inline-flex rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-medium text-yellow-300 ring-1 ring-inset ring-yellow-500/20";
    case "confirmed":
      return "inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300 ring-1 ring-inset ring-emerald-500/20";
    case "cancelled":
      return "inline-flex rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-300 ring-1 ring-inset ring-red-500/20";
    case "completed":
      return "inline-flex rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-300 ring-1 ring-inset ring-sky-500/20";
  }
}


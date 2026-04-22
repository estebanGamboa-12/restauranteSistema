"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Phone,
  Mail,
  AlertTriangle,
  UserCircle2,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";
import { useDashboardAuth } from "@/components/dashboard/DashboardAuthProvider";
import { DashboardModal } from "@/components/dashboard/DashboardModal";
import {
  buildWhatsappLink,
  renderMessageTemplate,
  type MessageTemplate,
} from "@/lib/message-templates";

type CustomerRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  marketing_opt_in: boolean;
  marketing_channel_email: boolean;
  marketing_channel_whatsapp: boolean;
  last_contacted_at: string | null;
  total_reservations: number;
  last_visit: string | null;
  needs_reengagement: boolean;
  inactive_days: number | null;
};

type Reservation = {
  id: string;
  customer_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  guests: number;
  reservation_date: string;
  reservation_time: string;
  status: string;
  notes: string | null;
  meal_type: string | null;
  zone_name: string | null;
};

export default function CustomersPage() {
  const { fetchWithAuth } = useDashboardAuth();
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(
    null
  );
  const [selectedTemplateKey, setSelectedTemplateKey] =
    useState<MessageTemplate["key"]>("customer_reengagement");
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetchWithAuth("/api/dashboard/customers");
        const data = await res.json();
        if (res.ok) {
          setCustomers(Array.isArray(data.customers) ? data.customers : []);
          setReservations(Array.isArray(data.reservations) ? data.reservations : []);
          setTemplates(Array.isArray(data.templates) ? data.templates : []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      return (
        c.name.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q))
      );
    });
  }, [customers, search]);

  const selectedCustomerReservations = useMemo(() => {
    if (!selectedCustomer) return [];
    return reservations
      .filter((r) => {
        if (selectedCustomer.id === r.customer_id) return true;
        return r.customer_name === selectedCustomer.name &&
          (selectedCustomer.email ? r.customer_email === selectedCustomer.email : true) &&
          (selectedCustomer.phone ? r.customer_phone === selectedCustomer.phone : true);
      })
      .sort((a, b) => {
        const aKey = `${a.reservation_date}T${a.reservation_time}`;
        const bKey = `${b.reservation_date}T${b.reservation_time}`;
        return aKey < bKey ? 1 : -1;
      });
  }, [reservations, selectedCustomer]);

  const totalReservasSeleccionado = selectedCustomerReservations.length;
  const selectedTemplate =
    templates.find((template) => template.key === selectedTemplateKey) ?? null;
  const selectedPreview = selectedCustomer
    ? renderMessageTemplate(selectedTemplate?.body ?? "", {
        customerName: selectedCustomer.name,
        restaurantName: "el restaurante",
        lastVisit: selectedCustomer.last_visit
          ? new Date(`${selectedCustomer.last_visit}T00:00:00`).toLocaleDateString("es-ES")
          : "",
        reservationDate: selectedCustomerReservations[0]?.reservation_date
          ? new Date(
              `${selectedCustomerReservations[0].reservation_date}T00:00:00`
            ).toLocaleDateString("es-ES")
          : "",
        reservationTime: selectedCustomerReservations[0]?.reservation_time?.slice(0, 5) ?? "",
        guests: selectedCustomerReservations[0]?.guests ?? "",
      })
    : "";

  const reengagementCount = customers.filter((c) => c.needs_reengagement).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-xalisco-cream sm:text-2xl">
            Clientes
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-xalisco-cream/60">
            <span>
              {customers.length}{" "}
              {customers.length === 1 ? "cliente" : "clientes"}
            </span>
            {reengagementCount > 0 && (
              <>
                <span className="text-xalisco-cream/25">·</span>
                <span className="inline-flex items-center gap-1 text-amber-300">
                  <AlertTriangle className="h-3 w-3" />
                  {reengagementCount} por reactivar
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-xalisco-cream/40" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o email..."
          className="w-full rounded-lg border border-[color:var(--xalisco-border)] bg-black/20 py-2.5 pl-9 pr-3 text-xs text-xalisco-cream outline-none placeholder:text-xalisco-cream/40 focus:border-xalisco-burnt-orange/60"
        />
      </div>

      {/* Mobile: cards */}
      <div className="space-y-2 sm:hidden">
        {loading ? (
          <p className="rounded-xl bg-white/[0.02] py-8 text-center text-xs text-xalisco-cream/60">
            Cargando clientes...
          </p>
        ) : filtered.length === 0 ? (
          <p className="rounded-xl bg-white/[0.02] py-8 text-center text-xs text-xalisco-cream/50">
            No hay clientes.
          </p>
        ) : (
          filtered.map((c) => {
            const initial = (c.name || "?").trim().charAt(0).toUpperCase();
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCustomer(c)}
                className="flex w-full items-center gap-3 rounded-xl border border-[color:var(--xalisco-border)] bg-xalisco-black-soft/60 p-3 text-left transition-colors hover:border-xalisco-burnt-orange/40"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-xalisco-burnt-orange/30 to-xalisco-gold/20 text-sm font-semibold text-xalisco-gold-bright">
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-xalisco-cream">
                        {c.name}
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-xalisco-cream/60">
                        {c.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {c.phone}
                          </span>
                        )}
                        {c.email && (
                          <span className="inline-flex max-w-full items-center gap-1 truncate">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{c.email}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-xalisco-burnt-orange/15 px-2 py-0.5 text-[10px] font-semibold text-xalisco-burnt-orange ring-1 ring-inset ring-xalisco-burnt-orange/30">
                      {c.total_reservations}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {c.needs_reengagement && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300 ring-1 ring-inset ring-amber-500/20">
                        <AlertTriangle className="h-3 w-3" />
                        {c.inactive_days ?? 0} días
                      </span>
                    )}
                    {c.marketing_opt_in && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300 ring-1 ring-inset ring-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" />
                        {c.marketing_channel_whatsapp
                          ? "WhatsApp OK"
                          : "Marketing OK"}
                      </span>
                    )}
                    {c.last_visit && (
                      <span className="text-[10px] text-xalisco-cream/50">
                        Últ.{" "}
                        {new Date(c.last_visit).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Desktop: tabla */}
      <div className="hidden overflow-hidden rounded-xl border border-[color:var(--xalisco-border)] bg-xalisco-black-soft/60 sm:block">
        {loading ? (
          <p className="p-6 text-center text-xs text-xalisco-cream/60">
            Cargando clientes...
          </p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-center text-xs text-xalisco-cream/60">
            No hay clientes.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-xs">
              <thead className="bg-xalisco-black-soft/95 text-xalisco-cream/70">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Cliente</th>
                  <th className="px-3 py-2.5 font-medium">Contacto</th>
                  <th className="px-3 py-2.5 font-medium">Consentimiento</th>
                  <th className="px-3 py-2.5 text-center font-medium">
                    Reservas
                  </th>
                  <th className="px-3 py-2.5 font-medium">Última</th>
                  <th className="px-3 py-2.5 font-medium">Aviso</th>
                  <th className="px-3 py-2.5 text-right font-medium">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, idx) => {
                  const initial = (c.name || "?").trim().charAt(0).toUpperCase();
                  return (
                    <tr
                      key={c.id}
                      className={
                        idx % 2 === 0
                          ? "bg-transparent hover:bg-white/[0.02]"
                          : "bg-white/[0.02] hover:bg-white/[0.04]"
                      }
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-xalisco-burnt-orange/30 to-xalisco-gold/20 text-[11px] font-semibold text-xalisco-gold-bright">
                            {initial}
                          </div>
                          <span className="text-[12px] font-medium text-xalisco-cream">
                            {c.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-xalisco-cream/75">
                        <div className="flex flex-col">
                          {c.phone && <span>{c.phone}</span>}
                          {c.email && (
                            <span className="truncate text-xalisco-cream/55">
                              {c.email}
                            </span>
                          )}
                          {!c.phone && !c.email && (
                            <span className="text-xalisco-cream/30">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-[11px]">
                        {c.marketing_opt_in ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300 ring-1 ring-inset ring-emerald-500/20">
                            <CheckCircle2 className="h-3 w-3" />
                            {c.marketing_channel_whatsapp
                              ? "WhatsApp"
                              : "Marketing"}
                          </span>
                        ) : (
                          <span className="text-xalisco-cream/50">
                            Solo operativo
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="inline-flex min-w-[1.75rem] justify-center rounded-full bg-xalisco-burnt-orange/15 px-2 py-0.5 text-[11px] font-semibold text-xalisco-burnt-orange ring-1 ring-inset ring-xalisco-burnt-orange/30">
                          {c.total_reservations}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-xalisco-cream/75">
                        {c.last_visit
                          ? new Date(c.last_visit).toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-[11px]">
                        {c.needs_reengagement ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300 ring-1 ring-inset ring-amber-500/20">
                            <AlertTriangle className="h-3 w-3" />
                            {c.inactive_days ?? 0} días
                          </span>
                        ) : (
                          <span className="text-xalisco-cream/30">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedCustomer(c)}
                          className="inline-flex items-center gap-1 rounded-md border border-[color:var(--xalisco-border)] px-2 py-1 text-[11px] text-xalisco-cream/85 hover:border-xalisco-burnt-orange/60 hover:text-xalisco-burnt-orange"
                        >
                          <UserCircle2 className="h-3.5 w-3.5" />
                          Ver perfil
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DashboardModal
        open={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title="Perfil de cliente"
        size="2xl"
      >
        <p className="mb-3 text-xs text-xalisco-cream/70">
          Historial de reservas y detalles.
        </p>
        {selectedCustomer && (
          <>
            <div className="mb-3 grid gap-3 text-xs sm:grid-cols-2">
              <div className="space-y-1 rounded-lg border border-white/[0.08] bg-black/30 p-3">
                <div className="text-[11px] text-xalisco-cream/60">
                  Nombre
                </div>
                <div className="text-sm font-medium text-xalisco-cream">
                  {selectedCustomer.name}
                </div>
                <div className="mt-2 text-[11px] text-xalisco-cream/60">
                  Email
                </div>
                <div className="text-xs text-xalisco-cream/85">
                  {selectedCustomer.email ?? "—"}
                </div>
                <div className="mt-2 text-[11px] text-xalisco-cream/60">
                  Teléfono
                </div>
                <div className="text-xs text-xalisco-cream/85">
                  {selectedCustomer.phone ?? "—"}
                </div>
                <div className="mt-2 text-[11px] text-xalisco-cream/60">
                  Consentimiento
                </div>
                <div className="text-xs text-xalisco-cream/85">
                  {selectedCustomer.marketing_opt_in
                    ? "Acepta mensajes manuales/marketing"
                    : "Solo comunicaciones operativas"}
                </div>
              </div>
              <div className="space-y-1 rounded-lg border border-white/[0.08] bg-black/30 p-3">
                <div className="text-[11px] text-xalisco-cream/60">
                  Total reservas
                </div>
                <div className="text-sm font-medium text-xalisco-cream">
                  {totalReservasSeleccionado}
                </div>
                <div className="mt-2 text-[11px] text-xalisco-cream/60">
                  Última reserva
                </div>
                <div className="text-xs text-xalisco-cream/85">
                  {selectedCustomer.last_visit
                    ? new Date(
                        selectedCustomer.last_visit
                      ).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    : "—"}
                </div>
                <div className="mt-3 text-[11px] text-xalisco-cream/60">
                  Aviso interno
                </div>
                <div className="text-xs text-xalisco-cream/70">
                  {selectedCustomer.needs_reengagement
                    ? `Cliente reactivable: lleva ${selectedCustomer.inactive_days ?? 0} días sin venir y ha dado consentimiento.`
                    : "Sin alerta de reactivación ahora mismo."}
                </div>
                <div className="mt-3 text-[11px] text-xalisco-cream/60">
                  Notas
                </div>
                <div className="text-xs text-xalisco-cream/70">
                  {selectedCustomer.notes ??
                    "Puedes usar las notas del cliente y de cada reserva para registrar preferencias, alergias u ocasiones especiales."}
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-white/[0.08] bg-black/40 p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-xs font-semibold text-xalisco-cream">
                    Plantilla sugerida
                  </div>
                  <p className="mt-1 text-[11px] text-xalisco-cream/60">
                    La app te prepara el texto; el envío puede seguir siendo manual.
                  </p>
                </div>
                <select
                  value={selectedTemplateKey}
                  onChange={(e) =>
                    setSelectedTemplateKey(
                      e.target.value as MessageTemplate["key"]
                    )
                  }
                  className="rounded-md border border-white/[0.12] bg-transparent px-2 py-1 text-[11px] text-xalisco-cream outline-none"
                >
                  {templates.map((template) => (
                    <option key={template.key} value={template.key}>
                      {template.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-3 rounded-lg border border-white/[0.08] bg-black/20 p-3 text-xs text-xalisco-cream/80 whitespace-pre-wrap">
                {selectedPreview || "Selecciona una plantilla para ver el texto sugerido."}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(selectedPreview);
                    setCopyMessage("Mensaje copiado");
                    setTimeout(() => setCopyMessage(null), 1500);
                  }}
                  className="rounded-md border border-white/[0.18] px-2 py-1 text-[11px] text-xalisco-cream/85 hover:border-xalisco-gold-bright/80"
                >
                  Copiar texto
                </button>
                {selectedCustomer?.phone ? (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!selectedCustomer?.phone) return;
                      const url = buildWhatsappLink(
                        selectedCustomer.phone,
                        selectedPreview
                      );
                      window.open(url, "_blank", "noopener,noreferrer");
                      try {
                        await fetchWithAuth(
                          `/api/dashboard/customers/${selectedCustomer.id}/contacted`,
                          { method: "POST" }
                        );
                      } catch {
                        // ignore
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/40 px-2.5 py-1 text-[11px] font-medium text-emerald-200 hover:bg-emerald-500/10"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Abrir WhatsApp
                  </button>
                ) : null}
                {copyMessage ? (
                  <span className="text-[11px] text-emerald-300">{copyMessage}</span>
                ) : null}
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-white/[0.08] bg-black/40">
              <div className="border-b border-white/[0.08] px-3 py-2 text-xs font-semibold text-xalisco-cream">
                Historial de reservas
              </div>
              {selectedCustomerReservations.length === 0 ? (
                <p className="px-3 py-3 text-xs text-xalisco-cream/60">
                  No hay reservas registradas para este cliente.
                </p>
              ) : (
                <table className="min-w-full border-separate border-spacing-0 text-left text-[11px]">
                  <thead className="bg-white/[0.02] text-xalisco-cream/70">
                    <tr>
                      <th className="px-3 py-2 font-medium">Fecha</th>
                      <th className="px-3 py-2 font-medium">Hora</th>
                      <th className="px-3 py-2 font-medium">Zona</th>
                      <th className="px-3 py-2 font-medium">Personas</th>
                      <th className="px-3 py-2 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCustomerReservations.map((r) => (
                      <tr key={r.id}>
                        <td className="px-3 py-1.5 text-xalisco-cream/85">
                          {new Date(r.reservation_date).toLocaleDateString(
                            "es-ES",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            }
                          )}
                        </td>
                        <td className="px-3 py-1.5 text-xalisco-cream/80">
                          {r.reservation_time}
                        </td>
                        <td className="px-3 py-1.5 text-xalisco-cream/80">
                          {r.zone_name ?? "—"}
                        </td>
                        <td className="px-3 py-1.5 text-xalisco-cream/80">
                          {r.guests}
                        </td>
                        <td className="px-3 py-1.5 text-xalisco-cream/80 capitalize">
                          {r.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </DashboardModal>
    </div>
  );
}


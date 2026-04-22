"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { useDashboardAuth } from "@/components/dashboard/DashboardAuthProvider";
import {
  Store,
  Phone,
  MapPin,
  Mail,
  Clock,
  Users as UsersIcon,
  Sun,
  Moon,
  Globe,
  Save,
} from "lucide-react";

function Section({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.06] bg-xalisco-black-soft/60">
      <div className="flex items-start gap-3 border-b border-white/[0.06] bg-gradient-to-r from-white/[0.03] to-transparent p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-xalisco-gold/15 text-xalisco-gold-bright">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-xalisco-cream">{title}</h3>
          {description && (
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-xalisco-cream/60">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  icon: Icon,
  children,
  hint,
  className,
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col ${className ?? ""}`}>
      <label className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-medium text-xalisco-cream/80">
        {Icon && <Icon className="h-3 w-3 text-xalisco-gold-bright/80" />}
        {label}
      </label>
      {children}
      {hint && (
        <p className="mt-1 text-[10.5px] text-xalisco-cream/50">{hint}</p>
      )}
    </div>
  );
}

const INPUT_CLS =
  "w-full rounded-lg border border-white/[0.14] bg-black/25 px-3 py-2 text-sm text-xalisco-cream outline-none transition focus:border-xalisco-gold-bright/70";

export default function SettingsPage() {
  const { fetchWithAuth } = useDashboardAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [openingTime, setOpeningTime] = useState("");
  const [closingTime, setClosingTime] = useState("");
  const [maxGuests, setMaxGuests] = useState<number | "">("");
  const [timezone, setTimezone] = useState("Europe/Madrid");
  const [comidaStart, setComidaStart] = useState("13:00");
  const [comidaEnd, setComidaEnd] = useState("16:00");
  const [cenaStart, setCenaStart] = useState("20:00");
  const [cenaEnd, setCenaEnd] = useState("23:00");
  const [slotInterval, setSlotInterval] = useState<number | "">(15);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetchWithAuth("/api/dashboard/settings");
        const data = await res.json();
        if (!res.ok) {
          showToast({ type: "error", message: data.error ?? "Error al cargar" });
          return;
        }
        const r = data.restaurant;
        if (r) {
          setName(r.name ?? "");
          setEmail(r.email ?? "");
          setPhone(r.phone ?? "");
          setAddress(r.address ?? "");
          setOpeningTime(r.opening_time ?? "");
          setClosingTime(r.closing_time ?? "");
          setMaxGuests(r.max_guests_per_reservation ?? "");
          setTimezone(r.timezone ?? "Europe/Madrid");
          setComidaStart(r.comida_start ?? "13:00");
          setComidaEnd(r.comida_end ?? "16:00");
          setCenaStart(r.cena_start ?? "20:00");
          setCenaEnd(r.cena_end ?? "23:00");
          setSlotInterval(
            r.slot_interval_minutes != null ? r.slot_interval_minutes : 15
          );
        }
      } catch {
        showToast({ type: "error", message: "Error al cargar la configuración" });
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const sanitizedName = name.trim();
    const sanitizedEmail = email.trim();
    const sanitizedPhone = phone.trim();
    const sanitizedAddress = address.trim();
    const maxGuestsNumber = maxGuests === "" ? null : Number(maxGuests);

    if (!sanitizedName) {
      showToast({ type: "error", message: "El nombre es obligatorio" });
      setSaving(false);
      return;
    }
    if (sanitizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
      showToast({ type: "error", message: "Email no válido" });
      setSaving(false);
      return;
    }
    if (sanitizedPhone && !/^[0-9+\s\-().]{6,20}$/.test(sanitizedPhone)) {
      showToast({ type: "error", message: "Teléfono no válido" });
      setSaving(false);
      return;
    }

    try {
      const res = await fetchWithAuth("/api/dashboard/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sanitizedName,
          email: sanitizedEmail || null,
          phone: sanitizedPhone || null,
          address: sanitizedAddress || null,
          opening_time: openingTime || null,
          closing_time: closingTime || null,
          max_guests_per_reservation: maxGuestsNumber,
          timezone: timezone || null,
          comida_start: comidaStart || null,
          comida_end: comidaEnd || null,
          cena_start: cenaStart || null,
          cena_end: cenaEnd || null,
          slot_interval_minutes:
            slotInterval === "" ? null : Number(slotInterval),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({ type: "error", message: data.error ?? "No se pudo guardar" });
      } else {
        showToast({ type: "success", message: "Configuración guardada" });
      }
    } catch {
      showToast({ type: "error", message: "No se pudo guardar" });
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-24 sm:pb-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-xalisco-cream sm:text-xl">
            Ajustes del restaurante
          </h2>
          <p className="mt-1 text-xs text-xalisco-cream/60">
            Datos básicos y preferencias de las reservas.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving || loading}
          className="hidden items-center gap-1.5 self-start rounded-lg bg-xalisco-burnt-orange px-3 py-2 text-xs font-semibold text-xalisco-black shadow-lg shadow-xalisco-burnt-orange/30 hover:bg-xalisco-burnt-orange-hover disabled:opacity-60 sm:inline-flex sm:self-auto"
        >
          <Save className="h-4 w-4" />
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-white/[0.06] bg-xalisco-black-soft/60 p-6 text-center text-xs text-xalisco-cream/60">
          Cargando ajustes…
        </div>
      ) : (
        <>
          <Section
            title="Información del restaurante"
            description="Datos que se muestran al público y se usan en las comunicaciones."
            icon={Store}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nombre del restaurante" icon={Store}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={INPUT_CLS}
                />
              </Field>
              <Field label="Email" icon={Mail}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={INPUT_CLS}
                  placeholder="hola@restaurante.com"
                />
              </Field>
              <Field label="Teléfono" icon={Phone}>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={INPUT_CLS}
                  placeholder="+34 600 000 000"
                />
              </Field>
              <Field label="Zona horaria" icon={Globe}>
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="Europe/Madrid"
                  className={INPUT_CLS}
                />
              </Field>
              <Field label="Dirección" icon={MapPin} className="sm:col-span-2">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={INPUT_CLS}
                  placeholder="Calle, número, ciudad…"
                />
              </Field>
            </div>
          </Section>

          <Section
            title="Horario y capacidad"
            description="Define el horario general del local y los límites de reserva."
            icon={Clock}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Apertura" icon={Sun}>
                <input
                  type="time"
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  className={INPUT_CLS}
                />
              </Field>
              <Field label="Cierre" icon={Moon}>
                <input
                  type="time"
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  className={INPUT_CLS}
                />
              </Field>
              <Field
                label="Máx. personas/reserva"
                icon={UsersIcon}
                hint="Límite por reserva en el formulario público."
              >
                <input
                  type="number"
                  min={1}
                  value={maxGuests === "" ? "" : maxGuests}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!v) setMaxGuests("");
                    else {
                      const n = Number(v);
                      setMaxGuests(Number.isNaN(n) ? "" : n);
                    }
                  }}
                  className={INPUT_CLS}
                />
              </Field>
            </div>
          </Section>

          <Section
            title="Franjas de reserva"
            description="El cliente elige Comida o Cena y solo verá horas dentro de la franja, con el intervalo que configures."
            icon={Clock}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/[0.08] bg-gradient-to-br from-amber-500/10 to-transparent p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-400/20 text-amber-200">
                    <Sun className="h-3.5 w-3.5" />
                  </span>
                  <h4 className="text-sm font-semibold text-xalisco-cream">
                    Comida
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Inicio">
                    <input
                      type="time"
                      value={comidaStart}
                      onChange={(e) => setComidaStart(e.target.value)}
                      className={INPUT_CLS}
                    />
                  </Field>
                  <Field label="Fin">
                    <input
                      type="time"
                      value={comidaEnd}
                      onChange={(e) => setComidaEnd(e.target.value)}
                      className={INPUT_CLS}
                    />
                  </Field>
                </div>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-gradient-to-br from-indigo-500/10 to-transparent p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-400/20 text-indigo-200">
                    <Moon className="h-3.5 w-3.5" />
                  </span>
                  <h4 className="text-sm font-semibold text-xalisco-cream">
                    Cena
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Inicio">
                    <input
                      type="time"
                      value={cenaStart}
                      onChange={(e) => setCenaStart(e.target.value)}
                      className={INPUT_CLS}
                    />
                  </Field>
                  <Field label="Fin">
                    <input
                      type="time"
                      value={cenaEnd}
                      onChange={(e) => setCenaEnd(e.target.value)}
                      className={INPUT_CLS}
                    />
                  </Field>
                </div>
              </div>
            </div>
            <div className="mt-3">
              <Field
                label="Intervalo de slots (minutos)"
                icon={Clock}
                hint="Cada cuántos minutos hay un slot disponible (5–60)."
              >
                <input
                  type="number"
                  min={5}
                  step={5}
                  max={60}
                  value={slotInterval === "" ? "" : slotInterval}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!v) setSlotInterval("");
                    else {
                      const n = Number(v);
                      setSlotInterval(Number.isNaN(n) ? "" : n);
                    }
                  }}
                  className={`${INPUT_CLS} sm:w-40`}
                />
              </Field>
            </div>
          </Section>
        </>
      )}

      {/* Sticky save móvil */}
      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-white/[0.08] bg-xalisco-black/95 p-3 backdrop-blur-md sm:hidden">
        <button
          type="submit"
          disabled={saving || loading}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-xalisco-burnt-orange px-4 py-3 text-sm font-semibold text-xalisco-black shadow-lg shadow-xalisco-burnt-orange/30 hover:bg-xalisco-burnt-orange-hover disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? "Guardando…" : "Guardar configuración"}
        </button>
      </div>
    </form>
  );
}

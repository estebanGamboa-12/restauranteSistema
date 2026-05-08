"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import Link from "next/link";
import { useSiteAuth } from "@/components/providers/SiteAuthProvider";

type Feedback = { type: "success" | "error"; text: string } | null;

type ZoneOption = {
  id: string;
  name: string;
  capacity: number | null;
};

type BookingHours = {
  timezone: string;
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

function buildTimeSlots(startStr: string, endStr: string, intervalMinutes: number): string[] {
  const start = timeToMinutes(startStr);
  const end = timeToMinutes(endStr);
  const slots: string[] = [];
  for (let min = start; min < end; min += intervalMinutes) {
    slots.push(minutesToTime(min));
  }
  return slots;
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

export default function ReservasPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const formSectionRef = useRef<HTMLElement>(null);
  const { user, fetchWithAuth } = useSiteAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [zones, setZones] = useState<ZoneOption[]>([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [bookingHours, setBookingHours] = useState<BookingHours | null>(null);
  const [mealType, setMealType] = useState<"comida" | "cena" | "">("");
  const [selectedDate, setSelectedDate] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingEmailAccepted, setMarketingEmailAccepted] = useState(false);
  const [marketingWhatsappAccepted, setMarketingWhatsappAccepted] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      setCustomerEmail((prev) => prev || user.email || "");
      try {
        const res = await fetchWithAuth("/api/account/profile", {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setCustomerName((prev) => prev || (data.name ?? ""));
          setCustomerPhone((prev) => prev || (data.phone ?? ""));
          setCustomerEmail((prev) => prev || (data.email ?? ""));
          if (data.marketing_channel_email) setMarketingEmailAccepted(true);
          if (data.marketing_channel_whatsapp)
            setMarketingWhatsappAccepted(true);
        }
      } catch {
        // ignore
      }
    }
    void loadProfile();
  }, [user, fetchWithAuth]);

  useEffect(() => {
    if (typeof window === "undefined" || !formSectionRef.current || !formRef.current) return;

    const fields = formRef.current.querySelectorAll(".reservation-field");
    if (!fields.length) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        fields,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: {
            trigger: formSectionRef.current,
            start: "top 82%",
            end: "top 45%",
            scrub: 1,
          },
        }
      );
    }, formSectionRef);

    return () => ctx.revert();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!privacyAccepted) {
      setFeedback({
        type: "error",
        text: "Debes aceptar la Política de Privacidad para continuar.",
      });
      return;
    }
    setIsSubmitting(true);
    setFeedback(null);

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      guests: Number(formData.get("guests")),
      date: formData.get("date"),
      time: formData.get("time"),
      message: formData.get("message"),
      zonePreference: formData.get("zonePreference")?.toString().trim() || "",
      mealType: formData.get("mealType")?.toString().trim() || "",
      marketingOptIn: marketingEmailAccepted || marketingWhatsappAccepted,
      marketingChannelEmail: marketingEmailAccepted,
      marketingChannelWhatsapp: marketingWhatsappAccepted,
    };

    try {
      const res = await fetch("/api/reservations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservation_date: payload.date,
          reservation_time: payload.time,
          guests: payload.guests,
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          notes: payload.message,
          zonePreference: payload.zonePreference,
          mealType: payload.mealType,
          marketingOptIn: payload.marketingOptIn,
          marketingChannelEmail: payload.marketingChannelEmail,
          marketingChannelWhatsapp: payload.marketingChannelWhatsapp,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.message || data.error || "No se pudo crear la reserva.",
        });
        return;
      }

      if (typeof data.redirect_url === "string" && data.redirect_url) {
        window.location.href = data.redirect_url;
        return;
      }

      if (data.checkout_url) {
        window.location.href = data.checkout_url as string;
        return;
      }

      setFeedback({
        type: "success",
        text: "Reserva creada correctamente.",
      });
    } catch {
      setFeedback({
        type: "error",
        text:
          "No hemos podido registrar tu reserva ahora mismo. Inténtalo de nuevo en unos minutos.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    async function loadZones() {
      try {
        setZonesLoading(true);
        const res = await fetch("/api/public/table-zones", { cache: "no-store" });
        const data = await res.json();
        if (res.ok && Array.isArray(data.zones)) {
          setZones(data.zones);
        }
      } catch {
        // ignore
      } finally {
        setZonesLoading(false);
      }
    }
    void loadZones();
  }, []);

  useEffect(() => {
    async function loadBookingHours() {
      try {
        const res = await fetch("/api/public/booking-hours", { cache: "no-store" });
        const data = await res.json();
        if (res.ok && data.timezone != null) {
          setBookingHours({
            timezone: data.timezone ?? "Europe/Madrid",
            comida: data.comida ?? { start: "13:00", end: "16:00" },
            cena: data.cena ?? { start: "20:00", end: "23:00" },
            slot_interval_minutes: data.slot_interval_minutes ?? 15,
          });
        }
      } catch {
        setBookingHours({
          timezone: "Europe/Madrid",
          comida: { start: "13:00", end: "16:00" },
          cena: { start: "20:00", end: "23:00" },
          slot_interval_minutes: 15,
        });
      }
    }
    void loadBookingHours();
  }, []);

  const timeSlots = (() => {
    if (!bookingHours || !mealType) return [];
    const range = mealType === "comida" ? bookingHours.comida : bookingHours.cena;
    const all = buildTimeSlots(
      range.start,
      range.end,
      bookingHours.slot_interval_minutes
    );
    const today = getTodayLocal();
    if (selectedDate && selectedDate === today) {
      return filterSlotsForToday(all, getNowMinutes());
    }
    return all;
  })();

  return (
    <div className="min-h-screen bg-xalisco-black">
      <header className="relative flex min-h-[45vh] flex-col items-center justify-center overflow-hidden border-b border-xalisco-burnt-orange/25 bg-xalisco-black-soft px-4 py-24">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25"
          style={{
            backgroundImage: "url(/hero.jpg)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-xalisco-black/60 to-xalisco-black-soft" />
        <div className="relative z-10 text-center">
          <motion.h1
            className="font-display text-4xl font-semibold tracking-tight text-xalisco-cream sm:text-5xl md:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            Reservas
          </motion.h1>
          <motion.p
            className="mt-4 text-lg text-xalisco-cream/80"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            Asegura tu mesa en Paco&apos;s Food, La Comida de Paco para comida o cena
          </motion.p>
        </div>
      </header>

      <section
        ref={formSectionRef}
        className="mx-auto max-w-xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
      >
        <div className="rounded-3xl border-2 border-xalisco-burnt-orange/30 bg-xalisco-black-soft/25 p-6 shadow-[0_24px_60px_rgba(45,31,28,0.35)] sm:p-8">
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="reservas-form space-y-6"
          >
            <div className="reservation-field">
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-xalisco-cream/90"
              >
                Nombre
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Tu nombre"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-lg border border-white/[0.12] bg-xalisco-black-soft/80 px-4 py-3.5 text-xalisco-cream placeholder:text-xalisco-cream/40 focus:border-xalisco-gold/60 focus:outline-none focus:ring-1 focus:ring-xalisco-gold/40"
              />
            </div>

            <div className="reservation-field">
              <label
                htmlFor="zonePreference"
                className="mb-2 block text-sm font-medium text-xalisco-cream/90"
              >
                Preferencia de zona <span className="text-xalisco-cream/60">(obligatorio)</span>
              </label>
              <select
                id="zonePreference"
                name="zonePreference"
                required
                disabled={zonesLoading}
                className="w-full rounded-lg border border-white/[0.12] bg-xalisco-black-soft/80 px-4 py-3.5 text-xalisco-cream focus:border-xalisco-gold/60 focus:outline-none focus:ring-1 focus:ring-xalisco-gold/40 disabled:opacity-60"
              >
                <option value="">
                  {zonesLoading ? "Cargando zonas..." : "Selecciona zona"}
                </option>
                {!zonesLoading &&
                  zones.map((z) => (
                    <option key={z.id} value={z.name}>
                      {z.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="reservation-field">
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-xalisco-cream/90"
              >
                Email <span className="text-xalisco-cream/50">(opcional)</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="tucorreo@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full rounded-lg border border-white/[0.12] bg-xalisco-black-soft/80 px-4 py-3.5 text-xalisco-cream placeholder:text-xalisco-cream/40 focus:border-xalisco-gold/60 focus:outline-none focus:ring-1 focus:ring-xalisco-gold/40"
              />
            </div>

            <div className="reservation-field">
              <label
                htmlFor="guests"
                className="mb-2 block text-sm font-medium text-xalisco-cream/90"
              >
                Número de personas
              </label>
              <input
                id="guests"
                name="guests"
                type="number"
                inputMode="numeric"
                min={1}
                max={500}
                required
                placeholder="Ej. 4 o 120"
                className="w-full rounded-lg border border-white/[0.12] bg-xalisco-black-soft/80 px-4 py-3.5 text-xalisco-cream placeholder:text-xalisco-cream/40 focus:border-xalisco-gold/60 focus:outline-none focus:ring-1 focus:ring-xalisco-gold/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <div className="reservation-field">
              <label
                htmlFor="mealType"
                className="mb-2 block text-sm font-medium text-xalisco-cream/90"
              >
                Comida o cena <span className="text-xalisco-cream/60">(obligatorio)</span>
              </label>
              <select
                id="mealType"
                name="mealType"
                required
                value={mealType}
                onChange={(e) => {
                  const v = e.target.value as "comida" | "cena" | "";
                  setMealType(v);
                }}
                className="w-full rounded-lg border border-white/[0.12] bg-xalisco-black-soft/80 px-4 py-3.5 text-xalisco-cream focus:border-xalisco-gold/60 focus:outline-none focus:ring-1 focus:ring-xalisco-gold/40"
              >
                <option value="">Selecciona comida o cena</option>
                <option value="comida">Comida</option>
                <option value="cena">Cena</option>
              </select>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="reservation-field">
                <label
                  htmlFor="date"
                  className="mb-2 block text-sm font-medium text-xalisco-cream/90"
                >
                  Fecha
                </label>
                <div className="relative">
                  <input
                    id="date"
                    name="date"
                    type="date"
                    required
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full rounded-lg border border-white/[0.12] bg-xalisco-black-soft/80 px-4 py-3.5 pr-10 text-sm text-xalisco-cream outline-none transition focus:border-xalisco-gold/60 focus:ring-1 focus:ring-xalisco-gold/40"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-xalisco-cream/50">
                    📅
                  </span>
                </div>
              </div>
              <div className="reservation-field">
                <label
                  htmlFor="time"
                  className="mb-2 block text-sm font-medium text-xalisco-cream/90"
                >
                  Hora
                </label>
                <select
                  id="time"
                  name="time"
                  required
                  disabled={!mealType || timeSlots.length === 0}
                  className="w-full rounded-lg border border-white/[0.12] bg-xalisco-black-soft/80 px-4 py-3.5 text-sm text-xalisco-cream outline-none transition focus:border-xalisco-gold/60 focus:ring-1 focus:ring-xalisco-gold/40 disabled:opacity-60"
                >
                  <option value="">
                    {!mealType
                      ? "Elige primero comida o cena"
                      : timeSlots.length === 0
                        ? selectedDate === getTodayLocal()
                          ? "No quedan horas para hoy. Elige otro día."
                          : "Cargando..."
                        : "Selecciona hora"}
                  </option>
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="reservation-field">
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-medium text-xalisco-cream/90"
              >
                Teléfono
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                placeholder="+34 600 000 000"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full rounded-lg border border-white/[0.12] bg-xalisco-black-soft/80 px-4 py-3.5 text-xalisco-cream placeholder:text-xalisco-cream/40 focus:border-xalisco-gold/60 focus:outline-none focus:ring-1 focus:ring-xalisco-gold/40"
              />
            </div>

            <div className="reservation-field">
              <label
                htmlFor="message"
                className="mb-2 block text-sm font-medium text-xalisco-cream/90"
              >
                Mensaje <span className="text-xalisco-cream/50">(opcional)</span>
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                placeholder="Comentarios, ocasión especial, alergias..."
                className="w-full resize-none rounded-lg border border-white/[0.12] bg-xalisco-black-soft/80 px-4 py-3.5 text-xalisco-cream placeholder:text-xalisco-cream/40 focus:border-xalisco-gold/60 focus:outline-none focus:ring-1 focus:ring-xalisco-gold/40"
              />
            </div>

            <div className="reservation-field">
              <label className="flex items-start gap-2 text-sm text-xalisco-cream/80">
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/30 bg-transparent text-xalisco-burnt-orange focus:ring-xalisco-gold/40"
                  required
                />
                <span>
                  He leído y acepto la{" "}
                  <Link
                    href="/privacidad"
                    target="_blank"
                    className="text-xalisco-gold-bright underline underline-offset-2 hover:text-xalisco-gold"
                  >
                    Política de Privacidad
                  </Link>
                  .
                </span>
              </label>
            </div>

            <div className="reservation-field space-y-3 rounded-2xl border border-white/[0.08] bg-black/15 p-4">
              <div>
                <p className="text-sm font-medium text-xalisco-cream/90">
                  Consentimiento opcional de contacto
                </p>
                <p className="mt-1 text-xs text-xalisco-cream/60">
                  Solo si quieres recibir mensajes manuales del restaurante fuera de la gestión normal de tu reserva.
                </p>
              </div>
              <label className="flex items-start gap-2 text-sm text-xalisco-cream/80">
                <input
                  type="checkbox"
                  checked={marketingEmailAccepted}
                  onChange={(e) => setMarketingEmailAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/30 bg-transparent text-xalisco-burnt-orange focus:ring-xalisco-gold/40"
                />
                <span>Acepto recibir mensajes comerciales o de seguimiento por email.</span>
              </label>
              <label className="flex items-start gap-2 text-sm text-xalisco-cream/80">
                <input
                  type="checkbox"
                  checked={marketingWhatsappAccepted}
                  onChange={(e) => setMarketingWhatsappAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/30 bg-transparent text-xalisco-burnt-orange focus:ring-xalisco-gold/40"
                />
                <span>Acepto recibir mensajes manuales por WhatsApp si el restaurante lo considera oportuno.</span>
              </label>
            </div>

            <div className="reservation-field pt-2">
              <motion.button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-xalisco-burnt-orange px-6 py-4 font-semibold text-xalisco-black transition-colors hover:bg-xalisco-burnt-orange-hover disabled:opacity-60"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                {isSubmitting ? "Enviando..." : "Confirmar reserva"}
              </motion.button>
            </div>
          </form>
          {feedback && (
            <p
              className={`mt-4 text-sm text-center ${
                feedback.type === "success"
                  ? "text-emerald-300"
                  : "text-red-300"
              }`}
            >
              {feedback.text}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

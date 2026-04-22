"use client";

import { useState } from "react";
import { motion } from "framer-motion";

type Feedback = { type: "success" | "error"; text: string } | null;

export default function CancelarReservaPage() {
  const [reservationId, setReservationId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/reservations/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservation_id: reservationId.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedback({
          type: "error",
          text: data.error ?? "No se pudo cancelar la reserva.",
        });
        return;
      }
      setFeedback({
        type: "success",
        text: data.refunded
          ? "Reserva cancelada. El reembolso se ha procesado."
          : "Reserva cancelada. Según la política, no corresponde reembolso.",
      });
    } catch {
      setFeedback({
        type: "error",
        text: "Error del servidor. Inténtalo de nuevo.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8">
      <motion.header
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="font-display text-4xl font-semibold tracking-tight text-xalisco-cream md:text-5xl">
          Cancelar reserva
        </h1>
        <p className="mt-4 text-sm text-xalisco-cream/70">
          Política de reembolso: el depósito se devuelve si cancelas con la
          antelación mínima configurada por el restaurante.
        </p>
      </motion.header>

      <motion.section
        className="mt-10 rounded-xl border border-white/[0.06] bg-xalisco-black-soft/60 p-6"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.1 }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-xalisco-cream/80">
              ID de reserva
            </label>
            <input
              value={reservationId}
              onChange={(e) => setReservationId(e.target.value)}
              required
              className="w-full rounded-md border border-white/[0.12] bg-transparent px-3 py-2 text-sm text-xalisco-cream outline-none"
              placeholder="Ej. f3273cf2-f9f8-..."
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-xalisco-cream/80">
                Email (o teléfono)
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-white/[0.12] bg-transparent px-3 py-2 text-sm text-xalisco-cream outline-none"
                placeholder="tucorreo@..."
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-xalisco-cream/80">
                Teléfono (o email)
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-md border border-white/[0.12] bg-transparent px-3 py-2 text-sm text-xalisco-cream outline-none"
                placeholder="+34 600 000 000"
              />
            </div>
          </div>

          {feedback && (
            <p
              className={`text-sm ${
                feedback.type === "success"
                  ? "text-emerald-300"
                  : "text-red-300"
              }`}
            >
              {feedback.text}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-xalisco-burnt-orange px-4 py-3 text-sm font-medium text-xalisco-black hover:bg-xalisco-burnt-orange-hover disabled:opacity-60"
          >
            {loading ? "Procesando..." : "Cancelar reserva"}
          </button>
        </form>
      </motion.section>
    </div>
  );
}


"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SITE_CONTACT } from "@/lib/site-contact";
import { useOrderCart } from "@/components/order/OrderCartProvider";
import { buildWaMeUrl, buildWhatsAppOrderMessage } from "@/lib/order-message";

type CheckoutDraft = {
  name: string;
  phone: string;
  pickupTime: string;
  notes: string;
};

function getDefaultPickupTime() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function CartDrawer() {
  const cart = useOrderCart();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<CheckoutDraft>({
    name: "",
    phone: "",
    pickupTime: getDefaultPickupTime(),
    notes: "",
  });

  const canCheckout = useMemo(() => {
    return (
      cart.items.length > 0 &&
      draft.name.trim().length > 1 &&
      draft.phone.trim().length > 5 &&
      /^\d{2}:\d{2}$/.test(draft.pickupTime.trim())
    );
  }, [cart.items.length, draft.name, draft.phone, draft.pickupTime]);

  function handleCheckout() {
    if (!canCheckout) return;
    const message = buildWhatsAppOrderMessage({
      name: draft.name.trim(),
      phone: draft.phone.trim(),
      pickupTime: draft.pickupTime.trim(),
      notes: draft.notes,
      items: cart.items.map((it) => ({ dish: it.dish, quantity: it.quantity })),
    });
    const url = buildWaMeUrl(SITE_CONTACT.whatsappHref, message);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-[#2d1f1c] px-4 py-3 text-sm font-extrabold uppercase tracking-wide text-[#fff9c4] shadow-[0_12px_30px_rgba(0,0,0,0.35)] ring-2 ring-[#ffeb3b]/60 hover:ring-[#ffeb3b] md:bottom-6 md:right-6"
        aria-label="Abrir carrito"
      >
        Carrito
        <span className="inline-flex min-w-[2rem] justify-center rounded-full bg-[#ffeb3b] px-2 py-0.5 text-xs font-black text-[#2d1f1c]">
          {cart.totalItems}
        </span>
      </button>

      {/* Backdrop */}
      {open && (
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 cursor-default bg-black/50"
          aria-label="Cerrar carrito"
        />
      )}

      {/* Drawer */}
      <aside
        className={[
          "fixed right-0 top-0 z-50 h-full w-[92vw] max-w-md transform border-l border-white/10 bg-[#2d1f1c] shadow-2xl transition-transform",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        aria-hidden={!open}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ffeb3b]/90">
                Pedido para llevar
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-[#fff8e1]">
                Tu carrito
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-semibold text-[#fff8e1]/80 hover:bg-white/10 hover:text-[#fff8e1]"
            >
              Cerrar
            </button>
          </div>

          <div className="flex-1 overflow-auto px-5 py-5">
            {cart.items.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-[#fff8e1]/70">
                Tu carrito está vacío. Añade platos desde la carta.
              </div>
            ) : (
              <div className="space-y-3">
                {cart.items.map((it) => (
                  <div
                    key={it.dish.id}
                    className="rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold uppercase tracking-wide text-[#fff9c4]">
                          {it.dish.name}
                        </p>
                        <p className="mt-1 text-xs text-[#fff8e1]/70">{it.dish.price}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => cart.remove(it.dish.id)}
                        className="rounded-md px-2 py-1 text-xs font-bold text-[#fff8e1]/70 hover:bg-white/10 hover:text-[#fff8e1]"
                      >
                        Quitar
                      </button>
                    </div>

                    <div className="mt-3 inline-flex items-center rounded-md border border-white/10 bg-[#2d1f1c]/40 p-1">
                      <button
                        type="button"
                        onClick={() => cart.decrement(it.dish.id)}
                        className="h-9 w-9 rounded-md text-base font-bold text-[#fff8e1] hover:bg-white/10"
                        aria-label={`Quitar una unidad de ${it.dish.name}`}
                      >
                        −
                      </button>
                      <span className="min-w-[2.5rem] text-center text-sm font-extrabold text-[#fff9c4]">
                        {it.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => cart.increment(it.dish.id)}
                        className="h-9 w-9 rounded-md text-base font-bold text-[#fff8e1] hover:bg-white/10"
                        aria-label={`Añadir una unidad de ${it.dish.name}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => cart.clear()}
                  className="mt-2 w-full rounded-md border border-white/15 bg-transparent px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#fff8e1]/80 hover:bg-white/10 hover:text-[#fff8e1]"
                >
                  Vaciar carrito
                </button>
              </div>
            )}

            <div className="mt-8 rounded-2xl border border-[#ffeb3b]/25 bg-[#3e2723] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ffeb3b]/90">
                Datos para el pedido
              </p>

              <div className="mt-4 grid gap-3">
                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-[#fff8e1]/80">Nombre</span>
                  <input
                    value={draft.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                    className="w-full rounded-md border border-white/10 bg-[#2d1f1c]/40 px-3 py-2.5 text-sm text-[#fff8e1] outline-none focus:border-[#ffeb3b]/60"
                    placeholder="Tu nombre"
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1">
                    <span className="text-xs font-semibold text-[#fff8e1]/80">Teléfono</span>
                    <input
                      value={draft.phone}
                      onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
                      className="w-full rounded-md border border-white/10 bg-[#2d1f1c]/40 px-3 py-2.5 text-sm text-[#fff8e1] outline-none focus:border-[#ffeb3b]/60"
                      placeholder="+34 600 000 000"
                      inputMode="tel"
                    />
                  </label>

                  <label className="grid gap-1">
                    <span className="text-xs font-semibold text-[#fff8e1]/80">Hora de recogida</span>
                    <input
                      type="time"
                      value={draft.pickupTime}
                      onChange={(e) => setDraft((d) => ({ ...d, pickupTime: e.target.value }))}
                      className="w-full rounded-md border border-white/10 bg-[#2d1f1c]/40 px-3 py-2.5 text-sm text-[#fff8e1] outline-none focus:border-[#ffeb3b]/60"
                    />
                  </label>
                </div>

                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-[#fff8e1]/80">
                    Notas (opcional)
                  </span>
                  <textarea
                    value={draft.notes}
                    onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                    className="min-h-[88px] w-full resize-none rounded-md border border-white/10 bg-[#2d1f1c]/40 px-3 py-2.5 text-sm text-[#fff8e1] outline-none focus:border-[#ffeb3b]/60"
                    placeholder="Alergias, sin cebolla, punto de la carne..."
                  />
                </label>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={!canCheckout}
                  className="rounded-md bg-[#ffeb3b] px-4 py-3 text-sm font-extrabold uppercase tracking-wide text-[#2d1f1c] hover:bg-[#fff176] disabled:opacity-50"
                >
                  Finalizar por WhatsApp
                </button>
                <Link
                  href="/contacto"
                  className="rounded-md border border-white/15 bg-transparent px-4 py-3 text-center text-sm font-semibold text-[#fff8e1]/85 hover:bg-white/10 hover:text-[#fff8e1]"
                >
                  Dudas / Contacto
                </Link>
              </div>

              <p className="mt-3 text-[11px] leading-relaxed text-[#fff8e1]/60">
                Al pulsar, se abrirá WhatsApp con el mensaje del pedido listo para enviar.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}


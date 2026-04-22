"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { useDashboardAuth } from "@/components/dashboard/DashboardAuthProvider";
import {
  CreditCard,
  ExternalLink,
  Link2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Wallet,
  Clock,
  Save,
} from "lucide-react";

export default function PaymentsPage() {
  const { fetchWithAuth } = useDashboardAuth();
  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [stripeStatus, setStripeStatus] = useState<{
    charges_enabled: boolean;
    details_submitted: boolean;
    payouts_enabled: boolean;
  } | null>(null);
  const [depositCents, setDepositCents] = useState<number>(0);
  const [savingDeposit, setSavingDeposit] = useState(false);
  const [refundWindowHours, setRefundWindowHours] = useState<number>(48);
  const { showToast } = useToast();

  async function load() {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/dashboard/payments");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al cargar pagos");
      setStripeAccountId(data.stripe_account_id ?? null);
      setStripeStatus(data.stripe ?? null);
      setDepositCents(Number(data.deposit_amount ?? 0));
      setRefundWindowHours(Number(data.refund_window_hours ?? 48));
    } catch (e) {
      showToast({
        type: "error",
        message: e instanceof Error ? e.message : "Error al cargar pagos",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleConnectStripe() {
    setConnecting(true);
    try {
      const res = await fetchWithAuth("/api/stripe/connect", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast({ type: "error", message: data.error ?? "Error del servidor" });
      } else if (data.url) {
        window.location.href = data.url;
      } else {
        showToast({
          type: "success",
          message: data.message ?? "Conexión iniciada",
        });
      }
    } catch {
      showToast({ type: "error", message: "Error del servidor" });
    } finally {
      setConnecting(false);
    }
  }

  async function handleOpenStripeDashboard() {
    try {
      const res = await fetchWithAuth("/api/stripe/login-link", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        showToast({ type: "error", message: data.error ?? "No se pudo abrir Stripe" });
        return;
      }
      window.open(data.url as string, "_blank", "noopener,noreferrer");
    } catch {
      showToast({ type: "error", message: "Error del servidor" });
    }
  }

  const stripeConnected = useMemo(() => {
    if (!stripeAccountId) return false;
    if (!stripeStatus) return true;
    return !!stripeStatus.details_submitted;
  }, [stripeAccountId, stripeStatus]);

  const stripeNeedsOnboarding = useMemo(() => {
    if (!stripeAccountId) return true;
    if (!stripeStatus) return false;
    return !stripeStatus.details_submitted || !stripeStatus.charges_enabled;
  }, [stripeAccountId, stripeStatus]);

  const stripeState = loading
    ? { label: "Comprobando…", tone: "loading" as const }
    : !stripeAccountId
      ? { label: "No conectado", tone: "off" as const }
      : stripeNeedsOnboarding
        ? { label: "Onboarding pendiente", tone: "pending" as const }
        : { label: "Conectado", tone: "ok" as const };

  const toneClasses: Record<string, string> = {
    ok: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    pending: "bg-amber-500/15 text-amber-200 border-amber-500/30",
    off: "bg-red-500/15 text-red-300 border-red-500/30",
    loading: "bg-white/5 text-xalisco-cream/70 border-white/10",
  };

  const StateIcon =
    stripeState.tone === "ok"
      ? CheckCircle2
      : stripeState.tone === "pending"
        ? AlertCircle
        : stripeState.tone === "off"
          ? XCircle
          : Clock;

  async function handleSaveDeposit() {
    setSavingDeposit(true);
    try {
      const res = await fetchWithAuth("/api/dashboard/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deposit_amount: Math.round(depositCents),
          refund_window_hours: Math.round(refundWindowHours),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast({ type: "error", message: data.error ?? "No se pudo guardar" });
        return;
      }
      showToast({ type: "success", message: "Depósito guardado" });
      void load();
    } catch {
      showToast({ type: "error", message: "Error del servidor" });
    } finally {
      setSavingDeposit(false);
    }
  }

  return (
    <div className="space-y-4 pb-6">
      <div>
        <h2 className="text-lg font-semibold text-xalisco-cream sm:text-xl">
          Pagos
        </h2>
        <p className="mt-1 text-xs text-xalisco-cream/60">
          Configura Stripe y el depósito para tus reservas.
        </p>
      </div>

      {/* Stripe connection card */}
      <section className="overflow-hidden rounded-2xl border border-white/[0.06] bg-xalisco-black-soft/60">
        <div className="bg-gradient-to-br from-[#635bff]/20 via-transparent to-transparent p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#635bff]/20 text-[#a5a0ff]">
              <CreditCard className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-xalisco-cream">
                  Conexión con Stripe
                </h3>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${toneClasses[stripeState.tone]}`}
                >
                  <StateIcon className="h-3 w-3" />
                  {stripeState.label}
                </span>
              </div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-xalisco-cream/60">
                Necesario para recibir los depósitos de reserva en tu cuenta
                bancaria. Los pagos se procesan con seguridad por Stripe.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-white/[0.06] bg-black/20 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <p className="text-[11px] text-xalisco-cream/60">
            {stripeConnected && !stripeNeedsOnboarding
              ? "Tu cuenta está lista para recibir pagos."
              : stripeAccountId
                ? "Completa el onboarding de Stripe para activar los cobros."
                : "Aún no has conectado ninguna cuenta."}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            {stripeAccountId && (
              <button
                type="button"
                onClick={handleOpenStripeDashboard}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.14] px-3 py-2 text-xs font-medium text-xalisco-cream/90 hover:border-xalisco-gold/50 hover:text-xalisco-gold-bright"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Abrir Stripe
              </button>
            )}
            <button
              type="button"
              onClick={handleConnectStripe}
              disabled={connecting}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-xalisco-burnt-orange px-3 py-2 text-xs font-semibold text-xalisco-black shadow-lg shadow-xalisco-burnt-orange/25 hover:bg-xalisco-burnt-orange-hover disabled:opacity-60"
            >
              <Link2 className="h-3.5 w-3.5" />
              {connecting
                ? "Conectando…"
                : stripeAccountId
                  ? "Continuar onboarding"
                  : "Conectar Stripe"}
            </button>
          </div>
        </div>
      </section>

      {/* Deposit config */}
      <section className="overflow-hidden rounded-2xl border border-white/[0.06] bg-xalisco-black-soft/60">
        <div className="flex items-start gap-3 p-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-xalisco-gold/15 text-xalisco-gold-bright">
            <Wallet className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-xalisco-cream">
              Configuración de depósito
            </h3>
            <p className="mt-1 text-[11.5px] leading-relaxed text-xalisco-cream/60">
              Importe que se cobrará al cliente al confirmar la reserva.
            </p>
          </div>
        </div>

        {/* Preview del importe */}
        <div className="mx-4 mb-3 rounded-xl border border-white/[0.06] bg-gradient-to-br from-xalisco-burnt-orange/20 via-xalisco-gold/10 to-transparent p-4 text-center">
          <p className="text-[10px] uppercase tracking-wider text-xalisco-cream/55">
            Depósito actual
          </p>
          <p className="mt-0.5 text-3xl font-bold text-xalisco-cream">
            {(depositCents / 100).toFixed(2)}
            <span className="ml-1 text-lg text-xalisco-gold-bright">€</span>
          </p>
          <p className="mt-0.5 text-[10.5px] text-xalisco-cream/55">
            por persona
          </p>
        </div>

        <div className="grid gap-3 border-t border-white/[0.06] bg-black/20 p-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-xalisco-cream/80">
              <span className="inline-flex items-center gap-1.5">
                <Wallet className="h-3 w-3 text-xalisco-gold-bright" />
                Depósito por persona (€)
              </span>
            </label>
            <input
              type="number"
              min={0}
              step={1}
              value={
                Number.isFinite(depositCents)
                  ? (depositCents / 100).toString()
                  : "0"
              }
              onChange={(e) => {
                const euros = Number(e.target.value);
                if (!Number.isFinite(euros)) return;
                setDepositCents(Math.round(euros * 100));
              }}
              className="w-full rounded-lg border border-white/[0.14] bg-black/30 px-3 py-2 text-sm text-xalisco-cream outline-none transition focus:border-xalisco-gold-bright/70"
            />
            <p className="mt-1 text-[10.5px] text-xalisco-cream/55">
              Se multiplicará por el nº de personas.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-xalisco-cream/80">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-xalisco-gold-bright" />
                Reembolso si cancela (horas)
              </span>
            </label>
            <input
              type="number"
              min={0}
              step={1}
              value={refundWindowHours}
              onChange={(e) => setRefundWindowHours(Number(e.target.value))}
              className="w-full rounded-lg border border-white/[0.14] bg-black/30 px-3 py-2 text-sm text-xalisco-cream outline-none transition focus:border-xalisco-gold-bright/70"
            />
            <p className="mt-1 text-[10.5px] text-xalisco-cream/55">
              Se reembolsa si cancela con {refundWindowHours}h o más de antelación.
            </p>
          </div>
          <div className="sm:col-span-2 sm:flex sm:justify-end">
            <button
              type="button"
              onClick={handleSaveDeposit}
              disabled={savingDeposit}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-xalisco-burnt-orange px-4 py-2.5 text-sm font-semibold text-xalisco-black shadow-lg shadow-xalisco-burnt-orange/25 hover:bg-xalisco-burnt-orange-hover disabled:opacity-60 sm:w-auto"
            >
              <Save className="h-4 w-4" />
              {savingDeposit ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSiteAuth } from "@/components/providers/SiteAuthProvider";

type AccountProfile = {
  name: string;
  email: string;
  phone: string;
  marketingOptIn: boolean;
  marketingChannelEmail: boolean;
  marketingChannelWhatsapp: boolean;
};

const EMPTY_PROFILE: AccountProfile = {
  name: "",
  email: "",
  phone: "",
  marketingOptIn: false,
  marketingChannelEmail: false,
  marketingChannelWhatsapp: false,
};

export default function AccountHomePage() {
  const { user, fetchWithAuth } = useSiteAuth();
  const [profile, setProfile] = useState<AccountProfile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetchWithAuth("/api/account/profile", {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setProfile({
            name: data.name ?? "",
            email: data.email ?? user?.email ?? "",
            phone: data.phone ?? "",
            marketingOptIn: !!data.marketing_opt_in,
            marketingChannelEmail: !!data.marketing_channel_email,
            marketingChannelWhatsapp: !!data.marketing_channel_whatsapp,
          });
        } else {
          setProfile((p) => ({ ...p, email: user?.email ?? "" }));
        }
      } catch {
        setProfile((p) => ({ ...p, email: user?.email ?? "" }));
      } finally {
        setLoading(false);
      }
    }
    if (user) void load();
  }, [user, fetchWithAuth]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setSaving(true);
    try {
      const res = await fetchWithAuth("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name.trim(),
          phone: profile.phone.trim(),
          marketing_opt_in:
            profile.marketingChannelEmail || profile.marketingChannelWhatsapp,
          marketing_channel_email: profile.marketingChannelEmail,
          marketing_channel_whatsapp: profile.marketingChannelWhatsapp,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar.");
      } else {
        setProfile((p) => ({
          ...p,
          marketingOptIn:
            profile.marketingChannelEmail || profile.marketingChannelWhatsapp,
        }));
        setMessage("Guardado.");
      }
    } catch {
      setError("No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-xalisco-cream/70">Cargando tus datos...</p>
    );
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSave}
        className="grid gap-4 text-xs sm:grid-cols-2"
      >
        <div className="flex flex-col">
          <label className="mb-1 text-xalisco-cream/70">Nombre</label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) =>
              setProfile((p) => ({ ...p, name: e.target.value }))
            }
            className="rounded-md border border-white/[0.12] bg-transparent px-3 py-2 text-xalisco-cream outline-none"
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-1 text-xalisco-cream/70">Email</label>
          <input
            type="email"
            value={profile.email}
            disabled
            className="rounded-md border border-white/[0.08] bg-white/5 px-3 py-2 text-xalisco-cream/80 outline-none"
          />
          <span className="mt-1 text-[10px] text-xalisco-cream/50">
            Para cambiar el email, contacta con el restaurante.
          </span>
        </div>
        <div className="flex flex-col sm:col-span-2">
          <label className="mb-1 text-xalisco-cream/70">Teléfono</label>
          <input
            type="tel"
            value={profile.phone}
            onChange={(e) =>
              setProfile((p) => ({ ...p, phone: e.target.value }))
            }
            placeholder="+34 600 000 000"
            className="rounded-md border border-white/[0.12] bg-transparent px-3 py-2 text-xalisco-cream outline-none sm:w-80"
          />
        </div>

        <div className="sm:col-span-2 space-y-2 rounded-lg border border-white/[0.08] bg-black/20 p-3">
          <p className="text-xs font-semibold text-xalisco-cream">
            Consentimientos de contacto
          </p>
          <label className="flex items-start gap-2 text-xs text-xalisco-cream/80">
            <input
              type="checkbox"
              checked={profile.marketingChannelEmail}
              onChange={(e) =>
                setProfile((p) => ({
                  ...p,
                  marketingChannelEmail: e.target.checked,
                }))
              }
              className="mt-0.5 h-4 w-4 rounded border-white/30 bg-transparent text-xalisco-burnt-orange focus:ring-xalisco-gold/40"
            />
            <span>Acepto recibir comunicaciones por email.</span>
          </label>
          <label className="flex items-start gap-2 text-xs text-xalisco-cream/80">
            <input
              type="checkbox"
              checked={profile.marketingChannelWhatsapp}
              onChange={(e) =>
                setProfile((p) => ({
                  ...p,
                  marketingChannelWhatsapp: e.target.checked,
                }))
              }
              className="mt-0.5 h-4 w-4 rounded border-white/30 bg-transparent text-xalisco-burnt-orange focus:ring-xalisco-gold/40"
            />
            <span>Acepto recibir mensajes manuales por WhatsApp.</span>
          </label>
        </div>

        {error ? (
          <p className="sm:col-span-2 text-xs text-red-300">{error}</p>
        ) : null}
        {message ? (
          <p className="sm:col-span-2 text-xs text-emerald-300">{message}</p>
        ) : null}

        <div className="sm:col-span-2 flex items-center gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-xalisco-burnt-orange px-4 py-2 text-xs font-semibold text-xalisco-black hover:bg-xalisco-burnt-orange-hover disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
          <Link
            href="/account/reservations"
            className="rounded-md border border-white/[0.12] px-4 py-2 text-xs font-semibold text-xalisco-cream/80 hover:border-xalisco-gold/50 hover:text-xalisco-gold-bright"
          >
            Ver mis reservas
          </Link>
        </div>
      </form>
    </div>
  );
}

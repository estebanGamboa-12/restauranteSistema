"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";
import {
  AuthShell,
  authButtonClass,
  authInputClass,
  authLabelClass,
} from "@/components/auth/AuthShell";

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterInner />
    </Suspense>
  );
}

function RegisterInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/account";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [privacy, setPrivacy] = useState(false);
  const [marketingEmail, setMarketingEmail] = useState(false);
  const [marketingWhatsapp, setMarketingWhatsapp] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!privacy) {
      setError("Debes aceptar la política de privacidad.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setSubmitting(true);

    const siteUrl =
      (typeof window !== "undefined" && window.location.origin) ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "";
    const redirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`;

    const { data, error: signUpError } = await supabaseBrowser.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          name: name.trim(),
          phone: phone.trim(),
          marketing_opt_in: marketingEmail || marketingWhatsapp,
          marketing_channel_email: marketingEmail,
          marketing_channel_whatsapp: marketingWhatsapp,
        },
      },
    });

    setSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      router.push(next);
      return;
    }

    setSuccess(
      "Te hemos enviado un correo de confirmación. Ábrelo y haz clic en el enlace para activar tu cuenta."
    );
  }

  return (
    <AuthShell
      title="Crear cuenta"
      subtitle="Necesaria para reservar y gestionar tus reservas."
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="font-semibold text-xalisco-gold-bright hover:text-xalisco-gold"
          >
            Iniciar sesión
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className={authLabelClass}>
            Nombre
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            className={authInputClass}
          />
        </div>

        <div>
          <label htmlFor="phone" className={authLabelClass}>
            Teléfono
          </label>
          <input
            id="phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+34 600 000 000"
            className={authInputClass}
          />
        </div>

        <div>
          <label htmlFor="email" className={authLabelClass}>
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@ejemplo.com"
            className={authInputClass}
          />
        </div>

        <div>
          <label htmlFor="password" className={authLabelClass}>
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            className={authInputClass}
          />
        </div>

        <div className="space-y-2 rounded-lg border border-white/[0.08] bg-black/20 p-3">
          <label className="flex items-start gap-2 text-xs text-xalisco-cream/80">
            <input
              type="checkbox"
              required
              checked={privacy}
              onChange={(e) => setPrivacy(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-white/30 bg-transparent text-xalisco-burnt-orange focus:ring-xalisco-gold/40"
            />
            <span>
              He leído y acepto la{" "}
              <Link
                href="/privacidad"
                target="_blank"
                className="text-xalisco-gold-bright underline underline-offset-2 hover:text-xalisco-gold"
              >
                política de privacidad
              </Link>
              .
            </span>
          </label>
          <label className="flex items-start gap-2 text-xs text-xalisco-cream/80">
            <input
              type="checkbox"
              checked={marketingEmail}
              onChange={(e) => setMarketingEmail(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-white/30 bg-transparent text-xalisco-burnt-orange focus:ring-xalisco-gold/40"
            />
            <span>Acepto recibir comunicaciones comerciales por email (opcional).</span>
          </label>
          <label className="flex items-start gap-2 text-xs text-xalisco-cream/80">
            <input
              type="checkbox"
              checked={marketingWhatsapp}
              onChange={(e) => setMarketingWhatsapp(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-white/30 bg-transparent text-xalisco-burnt-orange focus:ring-xalisco-gold/40"
            />
            <span>Acepto que el restaurante me contacte manualmente por WhatsApp (opcional).</span>
          </label>
        </div>

        {error ? (
          <p className="text-xs text-red-300">{error}</p>
        ) : null}
        {success ? (
          <p className="text-xs text-emerald-300">{success}</p>
        ) : null}

        <button type="submit" disabled={submitting} className={authButtonClass}>
          {submitting ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>
    </AuthShell>
  );
}

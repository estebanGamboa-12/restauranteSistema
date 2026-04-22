"use client";

import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";
import {
  AuthShell,
  authButtonClass,
  authInputClass,
  authLabelClass,
} from "@/components/auth/AuthShell";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    const siteUrl =
      (typeof window !== "undefined" && window.location.origin) ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "";
    const redirectTo = `${siteUrl}/auth/update-password`;

    const { error: resetError } = await supabaseBrowser.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo }
    );

    setSubmitting(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSuccess(
      "Si el email está registrado, recibirás un enlace para restablecer la contraseña."
    );
  }

  return (
    <AuthShell
      title="Recuperar contraseña"
      subtitle="Te enviaremos un enlace por email."
      footer={
        <>
          <Link
            href="/login"
            className="font-semibold text-xalisco-gold-bright hover:text-xalisco-gold"
          >
            Volver a iniciar sesión
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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

        {error ? <p className="text-xs text-red-300">{error}</p> : null}
        {success ? (
          <p className="text-xs text-emerald-300">{success}</p>
        ) : null}

        <button type="submit" disabled={submitting} className={authButtonClass}>
          {submitting ? "Enviando..." : "Enviar enlace"}
        </button>
      </form>
    </AuthShell>
  );
}

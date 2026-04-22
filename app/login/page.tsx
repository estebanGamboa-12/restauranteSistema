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

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: signInError } = await supabaseBrowser.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setSubmitting(false);

    if (signInError) {
      setError(
        signInError.message === "Invalid login credentials"
          ? "Email o contraseña incorrectos."
          : signInError.message
      );
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <AuthShell
      title="Iniciar sesión"
      subtitle="Accede a tus reservas y datos."
      footer={
        <>
          ¿Aún no tienes cuenta?{" "}
          <Link
            href={`/register?next=${encodeURIComponent(next)}`}
            className="font-semibold text-xalisco-gold-bright hover:text-xalisco-gold"
          >
            Crear cuenta
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

        <div>
          <label htmlFor="password" className={authLabelClass}>
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tu contraseña"
            className={authInputClass}
          />
        </div>

        {error ? <p className="text-xs text-red-300">{error}</p> : null}

        <button type="submit" disabled={submitting} className={authButtonClass}>
          {submitting ? "Entrando..." : "Entrar"}
        </button>

        <div className="text-center">
          <Link
            href="/recuperar"
            className="text-xs text-xalisco-cream/70 hover:text-xalisco-gold-bright"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

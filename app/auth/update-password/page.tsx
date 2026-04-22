"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";
import {
  AuthShell,
  authButtonClass,
  authInputClass,
  authLabelClass,
} from "@/components/auth/AuthShell";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Supabase intercambia el token en la URL automáticamente tras el recovery.
    const { data: sub } = supabaseBrowser.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });
    // También comprobamos si ya hay sesión iniciada.
    void supabaseBrowser.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== password2) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabaseBrowser.auth.updateUser({
      password,
    });
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess("Contraseña actualizada. Redirigiendo...");
    setTimeout(() => {
      router.push("/account");
      router.refresh();
    }, 1200);
  }

  return (
    <AuthShell
      title="Nueva contraseña"
      subtitle="Elige una nueva contraseña segura."
      footer={
        <Link
          href="/login"
          className="font-semibold text-xalisco-gold-bright hover:text-xalisco-gold"
        >
          Volver a iniciar sesión
        </Link>
      }
    >
      {!ready ? (
        <p className="text-sm text-xalisco-cream/70">
          Validando el enlace... Si no ocurre nada, pide uno nuevo en{" "}
          <Link
            href="/recuperar"
            className="text-xalisco-gold-bright hover:text-xalisco-gold"
          >
            Recuperar contraseña
          </Link>
          .
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className={authLabelClass}>
              Nueva contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={authInputClass}
            />
          </div>
          <div>
            <label htmlFor="password2" className={authLabelClass}>
              Repite la contraseña
            </label>
            <input
              id="password2"
              type="password"
              required
              minLength={8}
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              className={authInputClass}
            />
          </div>

          {error ? <p className="text-xs text-red-300">{error}</p> : null}
          {success ? (
            <p className="text-xs text-emerald-300">{success}</p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className={authButtonClass}
          >
            {submitting ? "Guardando..." : "Guardar contraseña"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}

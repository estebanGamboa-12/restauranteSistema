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

const DEMO_PASSWORD = "12341234";

const DEMO_ROLES = [
  {
    id: "admin",
    label: "Entrar como admin",
    email: "admin+disfrutar-demo@tenant-demo.local",
    description: "Control total del sistema y del panel.",
  },
  {
    id: "manager",
    label: "Entrar como manager",
    email: "manager+disfrutar-demo@tenant-demo.local",
    description: "Gestion de reservas, clientes y operativa.",
  },
  {
    id: "customer",
    label: "Entrar como cliente",
    email: "lucia1+disfrutar-demo@tenant-demo.local",
    description: "Vista de cuenta, historial y reservas del cliente.",
  },
] as const;

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
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

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
          ? "Email o contrasena incorrectos."
          : signInError.message
      );
      return;
    }

    router.push(next);
    router.refresh();
  }

  function fillDemoAccess(roleId: string) {
    const role = DEMO_ROLES.find((entry) => entry.id === roleId);
    if (!role) return;
    setEmail(role.email);
    setPassword(DEMO_PASSWORD);
    setSelectedRole(roleId);
    setError(null);
  }

  return (
    <AuthShell
      title="Iniciar sesion"
      subtitle="Accede a tus reservas y datos."
      footer={
        <>
          Aun no tienes cuenta?{" "}
          <Link
            href={`/register?next=${encodeURIComponent(next)}`}
            className="font-semibold text-xalisco-gold-bright hover:text-xalisco-gold"
          >
            Crear cuenta
          </Link>
        </>
      }
    >
      <div className="mb-5 rounded-3xl border border-xalisco-gold-bright/20 bg-xalisco-gold-bright/8 p-4 text-sm text-xalisco-cream/85">
        <p className="text-[11px] uppercase tracking-[0.28em] text-xalisco-gold-bright">
          Acceso demo
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-xalisco-cream">
          Si quieres ver todo el sistema por dentro, accede asi
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-xalisco-cream/70">
          Primero entra en{" "}
          <Link
            href="/restaurantes"
            className="text-xalisco-gold-bright underline underline-offset-2"
          >
            /restaurantes
          </Link>{" "}
          y elige <span className="text-xalisco-cream">Disfrutar Demo</span>.
          Luego pulsa uno de estos accesos y el formulario se rellena solo.
        </p>

        <div className="mt-4 grid gap-3">
          {DEMO_ROLES.map((role) => {
            const active = selectedRole === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => fillDemoAccess(role.id)}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  active
                    ? "border-xalisco-gold-bright/55 bg-xalisco-gold-bright/14"
                    : "border-white/10 bg-black/20 hover:border-xalisco-gold-bright/30 hover:bg-black/30"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-xalisco-cream">
                    {role.label}
                  </span>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-xalisco-gold-bright">
                    Demo
                  </span>
                </div>
                <p className="mt-2 text-xs text-xalisco-cream/65">
                  {role.description}
                </p>
                <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-xalisco-cream/85">
                  <div>{role.email}</div>
                  <div className="mt-1 text-xalisco-cream/60">
                    Contrasena: {DEMO_PASSWORD}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

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
            Contrasena
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tu contrasena"
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
            Olvidaste tu contrasena?
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

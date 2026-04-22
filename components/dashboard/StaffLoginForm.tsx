"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Props = { onSuccess: () => void };

export function StaffLoginForm({ onSuccess }: Props) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const trimmedName = name.trim();
    try {
      if (trimmedName.includes("@")) {
        const { data: authData, error: authError } = await supabaseBrowser.auth.signInWithPassword({
          email: trimmedName,
          password,
        });
        if (authError) {
          setError("Email o contraseña incorrectos");
          return;
        }
        if (authData.session) {
          await supabaseBrowser.auth.setSession({
            access_token: authData.session.access_token,
            refresh_token: authData.session.refresh_token ?? "",
          });
          onSuccess();
        }
        return;
      }
      const res = await fetch("/api/auth/staff-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Usuario o contraseña incorrectos");
        return;
      }
      if (data.access_token) {
        await supabaseBrowser.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token ?? "",
        });
        onSuccess();
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border border-white/[0.1] bg-[#0b1424] p-6 shadow-xl">
        <h2 className="text-center text-lg font-semibold text-xalisco-cream">
          Entrar al panel
        </h2>
        <p className="mt-1 text-center text-xs text-xalisco-cream/60">
          Admin: email. Staff: nombre de usuario.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="staff-name" className="mb-1 block text-xs text-xalisco-cream/80">
              Usuario o email
            </label>
            <input
              id="staff-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="username"
              className="w-full rounded-md border border-white/[0.12] bg-transparent px-3 py-2 text-sm text-xalisco-cream outline-none focus:border-xalisco-gold/50"
              placeholder="Nombre (staff) o email (admin)"
            />
          </div>
          <div>
            <label htmlFor="staff-password" className="mb-1 block text-xs text-xalisco-cream/80">
              Contraseña
            </label>
            <input
              id="staff-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-white/[0.12] bg-transparent px-3 py-2 text-sm text-xalisco-cream outline-none focus:border-xalisco-gold/50"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-xalisco-burnt-orange py-2.5 text-sm font-medium text-xalisco-black hover:bg-xalisco-burnt-orange-hover disabled:opacity-60"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

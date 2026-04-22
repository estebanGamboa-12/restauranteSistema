"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useSiteAuth } from "@/components/providers/SiteAuthProvider";

const ACCOUNT_LINKS = [
  { href: "/account", label: "Mi cuenta" },
  { href: "/account/reservations", label: "Mis reservas" },
];

export default function AccountLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useSiteAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, pathname, router]);

  if (loading || !user) {
    return (
      <div className="min-h-[60vh] bg-xalisco-black px-4 py-24 text-center text-sm text-xalisco-cream/70">
        Cargando tu cuenta...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-xalisco-black px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold text-xalisco-cream sm:text-4xl">
              Tu cuenta
            </h1>
            <p className="mt-1 text-sm text-xalisco-cream/70">{user.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {ACCOUNT_LINKS.map((link) => {
              const active =
                link.href === "/account"
                  ? pathname === "/account"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-md border px-3 py-2 text-xs font-semibold transition-colors",
                    active
                      ? "border-xalisco-gold/60 text-xalisco-gold-bright"
                      : "border-white/[0.12] text-xalisco-cream/80 hover:border-xalisco-gold/40 hover:text-xalisco-gold-bright"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-md border border-white/[0.12] px-3 py-2 text-xs font-semibold text-xalisco-cream/80 transition-colors hover:border-xalisco-gold/40 hover:text-xalisco-gold-bright"
            >
              Salir
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-xalisco-black-soft/60 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.25)] sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

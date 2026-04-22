"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import { LogOut, Menu, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { ToastProvider } from "@/components/ui/toast";
import {
  DashboardAuthProvider,
  useDashboardAuth,
} from "@/components/dashboard/DashboardAuthProvider";
import { RoleGuard } from "@/components/dashboard/RoleGuard";
import { StaffLoginForm } from "@/components/dashboard/StaffLoginForm";
import { NavIcon } from "@/components/dashboard/nav-icons";

/** Rutas que aparecen en la barra inferior móvil (máx. 5 visibles). */
const MOBILE_TAB_ORDER = [
  "/dashboard",
  "/dashboard/reservations",
  "/dashboard/calendar",
  "/dashboard/customers",
  "/dashboard/menu",
];

function DashboardSidebarAndContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const {
    visibleSidebarLinks,
    name,
    role,
    loading,
    error,
    restaurantId,
    restaurantName,
    refetch,
  } = useDashboardAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userName = name ?? "Staff";
  const roleLabel =
    role === "admin" ? "Admin" : role === "manager" ? "Manager" : "Staff";

  const showLogin = !loading && (error || !restaurantId);
  if (showLogin) {
    return (
      <div className="min-h-screen bg-xalisco-black">
        <ToastProvider>
          <StaffLoginForm onSuccess={refetch} />
        </ToastProvider>
      </div>
    );
  }

  const mobileTabs = MOBILE_TAB_ORDER.map((href) =>
    visibleSidebarLinks.find((l) => l.href === href)
  ).filter((l): l is NonNullable<typeof l> => Boolean(l));

  return (
    <div className="flex min-h-screen min-w-0 overflow-x-hidden bg-xalisco-black text-xalisco-cream">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[color:var(--xalisco-border)] bg-xalisco-black-soft/60 px-4 py-6 sm:flex">
        <div className="mb-8 px-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-xalisco-gold-bright">
            Admin
          </div>
          <div className="mt-1 line-clamp-1 text-sm font-medium text-xalisco-cream">
            {restaurantName ?? "Restaurante"}
          </div>
        </div>
        <nav className="flex-1 space-y-1 text-sm">
          {(loading ? [] : visibleSidebarLinks).map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                  active
                    ? "bg-xalisco-burnt-orange/15 text-xalisco-gold-bright ring-1 ring-inset ring-xalisco-burnt-orange/30"
                    : "text-xalisco-cream/75 hover:bg-white/5 hover:text-xalisco-cream"
                )}
              >
                <NavIcon
                  href={item.href}
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    active
                      ? "text-xalisco-burnt-orange"
                      : "text-xalisco-cream/50 group-hover:text-xalisco-cream/80"
                  )}
                />
                <span className="truncate">{item.label}</span>
                {active && (
                  <ChevronRight className="ml-auto h-3.5 w-3.5 text-xalisco-burnt-orange" />
                )}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 rounded-lg border border-[color:var(--xalisco-border)] bg-black/30 p-3">
          <div className="truncate text-xs font-medium text-xalisco-cream">
            {userName}
          </div>
          <div className="mt-0.5 text-[11px] text-xalisco-muted">{roleLabel}</div>
          <button
            type="button"
            onClick={async () => {
              await supabaseBrowser.auth.signOut();
              refetch();
            }}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-[color:var(--xalisco-border)] bg-transparent px-2 py-1.5 text-[11px] text-xalisco-cream/80 transition-colors hover:border-xalisco-burnt-orange/60 hover:text-xalisco-burnt-orange"
          >
            <LogOut className="h-3.5 w-3.5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 flex min-w-0 flex-shrink-0 items-center gap-2 border-b border-[color:var(--xalisco-border)] bg-xalisco-black/85 px-3 py-2.5 backdrop-blur-lg sm:px-6 sm:py-3 lg:px-8">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[color:var(--xalisco-border)] bg-xalisco-black-soft/50 text-xalisco-cream transition-colors hover:border-xalisco-burnt-orange/60 hover:text-xalisco-burnt-orange sm:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold text-xalisco-cream sm:text-base">
              {restaurantName ?? "Panel del restaurante"}
            </h1>
            <p className="truncate text-[11px] text-xalisco-muted">
              Panel de administración · {roleLabel}
            </p>
          </div>
          <div className="hidden sm:flex sm:flex-col sm:items-end">
            <span className="truncate text-xs font-medium text-xalisco-cream">
              {userName}
            </span>
            <span className="text-[11px] text-xalisco-muted">{roleLabel}</span>
          </div>
          <button
            type="button"
            onClick={async () => {
              await supabaseBrowser.auth.signOut();
              refetch();
            }}
            className="hidden items-center gap-1.5 rounded-md border border-[color:var(--xalisco-border)] bg-xalisco-black-soft/50 px-3 py-1.5 text-[11px] font-medium text-xalisco-cream/85 transition-colors hover:border-xalisco-burnt-orange/60 hover:text-xalisco-burnt-orange sm:inline-flex"
          >
            <LogOut className="h-3.5 w-3.5" />
            Salir
          </button>
        </header>

        {/* Drawer móvil */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm sm:hidden"
              aria-hidden
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed left-0 top-0 z-50 flex h-full w-[min(300px,88vw)] flex-col border-r border-[color:var(--xalisco-border)] bg-xalisco-black-soft shadow-[0_20px_60px_rgba(0,0,0,0.6)] sm:hidden">
              <div className="flex items-center justify-between border-b border-[color:var(--xalisco-border)] px-4 py-3.5">
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-xalisco-gold-bright">
                    Admin
                  </div>
                  <div className="mt-0.5 truncate text-sm font-medium text-xalisco-cream">
                    {restaurantName ?? "Restaurante"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="shrink-0 rounded-md p-1.5 text-xalisco-cream/75 hover:bg-white/5 hover:text-xalisco-cream"
                  aria-label="Cerrar menú"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
                {(loading ? [] : visibleSidebarLinks).map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                        active
                          ? "bg-xalisco-burnt-orange/15 text-xalisco-gold-bright ring-1 ring-inset ring-xalisco-burnt-orange/30"
                          : "text-xalisco-cream/80 hover:bg-white/5 hover:text-xalisco-cream"
                      )}
                    >
                      <NavIcon
                        href={item.href}
                        className={cn(
                          "h-5 w-5 shrink-0",
                          active
                            ? "text-xalisco-burnt-orange"
                            : "text-xalisco-cream/55"
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-[color:var(--xalisco-border)] p-3">
                <div className="mb-2 px-2">
                  <div className="truncate text-xs font-medium text-xalisco-cream">
                    {userName}
                  </div>
                  <div className="text-[11px] text-xalisco-muted">
                    {roleLabel}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await supabaseBrowser.auth.signOut();
                    refetch();
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-[color:var(--xalisco-border)] bg-black/30 px-3 py-2.5 text-xs font-medium text-xalisco-cream hover:border-xalisco-burnt-orange/60 hover:text-xalisco-burnt-orange"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          </>
        )}

        {/* Contenido */}
        <main className="flex min-h-0 flex-1 flex-col overflow-x-hidden px-3 pb-24 pt-4 sm:px-6 sm:pb-6 sm:pt-6 lg:px-8">
          <div className="min-h-0 min-w-0 flex-1">
            <div className="h-full min-h-0 rounded-2xl border border-[color:var(--xalisco-border)] bg-xalisco-black-soft/40 p-3 shadow-[0_18px_55px_rgba(0,0,0,0.35)] sm:p-5">
              <RoleGuard>{children}</RoleGuard>
            </div>
          </div>
        </main>

        {/* Bottom tab bar móvil */}
        <nav
          className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-between border-t border-[color:var(--xalisco-border)] bg-xalisco-black/95 px-1 pb-[env(safe-area-inset-bottom,0.25rem)] pt-1 backdrop-blur-lg sm:hidden"
          aria-label="Navegación móvil"
        >
          {mobileTabs.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-medium transition-colors",
                  active
                    ? "text-xalisco-burnt-orange"
                    : "text-xalisco-cream/65 hover:text-xalisco-cream"
                )}
                aria-current={active ? "page" : undefined}
              >
                <NavIcon
                  href={item.href}
                  className={cn(
                    "h-5 w-5",
                    active ? "text-xalisco-burnt-orange" : "text-xalisco-cream/70"
                  )}
                />
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <DashboardAuthProvider>
        <DashboardSidebarAndContent>{children}</DashboardSidebarAndContent>
      </DashboardAuthProvider>
    </ToastProvider>
  );
}

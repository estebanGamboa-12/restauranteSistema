"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useDashboardAuth } from "./DashboardAuthProvider";

/**
 * Redirects to /dashboard if the current user's role cannot access the current route.
 * Renders children only when access is allowed.
 */
export function RoleGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { canAccessRoute, loading, error } = useDashboardAuth();

  useEffect(() => {
    if (loading || error) return;
    if (!canAccessRoute(pathname ?? "/dashboard")) {
      window.location.href = "/dashboard";
    }
  }, [pathname, canAccessRoute, loading, error]);

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-xalisco-cream/60">
        Cargando…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300">
        No se pudo cargar la sesión. Comprueba tu conexión.
      </div>
    );
  }

  if (!canAccessRoute(pathname ?? "/dashboard")) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-xalisco-cream/60">
        Redirigiendo…
      </div>
    );
  }

  return <>{children}</>;
}

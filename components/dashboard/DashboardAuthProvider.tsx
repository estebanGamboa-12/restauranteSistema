"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import {
  getVisibleSidebarLinks,
  can as canPermissionFallback,
  canAccessRoute as canAccessRouteFallback,
  type DashboardRole,
  type DashboardPermission,
} from "@/lib/rbac";

type DashboardAuthState = {
  role: DashboardRole | null;
  name: string | null;
  email: string | null;
  restaurantId: string | null;
  restaurantName: string | null;
  permissions: DashboardPermission[] | null;
  loading: boolean;
  error: boolean;
};

type DashboardAuthContextValue = DashboardAuthState & {
  can: (permission: DashboardPermission) => boolean;
  visibleSidebarLinks: { href: string; label: string; permission: DashboardPermission }[];
  canAccessRoute: (pathname: string) => boolean;
  fetchWithAuth: (url: string, init?: RequestInit) => Promise<Response>;
  refetch: () => Promise<void>;
};

const DashboardAuthContext = createContext<DashboardAuthContextValue | null>(null);

export function DashboardAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DashboardAuthState>({
    role: null,
    name: null,
    email: null,
    restaurantId: null,
    restaurantName: null,
    permissions: null,
    loading: true,
    error: false,
  });

  const fetchSession = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: false }));
    try {
      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();
      const token = session?.access_token ?? "";
      const res = await fetch("/api/auth/me", {
        cache: "no-store",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        setState({
          role: null,
          name: null,
          email: null,
          restaurantId: null,
          restaurantName: null,
          permissions: null,
          loading: false,
          error: true,
        });
        return;
      }
      const data = await res.json();
      setState({
        role: data.role ?? "staff",
        name: data.name ?? null,
        email: data.email ?? null,
        restaurantId: data.restaurantId ?? null,
        restaurantName: data.restaurantName ?? null,
        permissions: Array.isArray(data.permissions) ? data.permissions : null,
        loading: false,
        error: false,
      });
    } catch {
      setState((s) => ({
        ...s,
        loading: false,
        error: true,
      }));
    }
  }, []);

  useEffect(() => {
    fetchSession();
    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange(() => {
      void fetchSession();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchSession]);

  const can = useCallback(
    (permission: DashboardPermission) => {
      if (!state.role) return false;
      if (state.permissions) return state.permissions.includes(permission);
      return canPermissionFallback(state.role, permission);
    },
    [state.role, state.permissions]
  );

  const visibleSidebarLinks = state.role
    ? (state.permissions
        ? [
            { href: "/dashboard", label: "Panel", permission: "dashboard" as const },
            { href: "/dashboard/reservations", label: "Reservas", permission: "reservations" as const },
            { href: "/dashboard/calendar", label: "Calendario", permission: "calendar" as const },
            { href: "/dashboard/menu", label: "Carta", permission: "menu" as const },
            { href: "/dashboard/tables", label: "Mesas", permission: "tables" as const },
            { href: "/dashboard/customers", label: "Clientes", permission: "customers" as const },
            { href: "/dashboard/payments", label: "Pagos", permission: "payments" as const },
            { href: "/dashboard/settings", label: "Ajustes", permission: "settings" as const },
            { href: "/dashboard/staff", label: "Staff", permission: "staff" as const },
          ].filter((link) => state.permissions?.includes(link.permission))
        : getVisibleSidebarLinks(state.role))
    : [];

  const canAccessRouteForRole = useCallback(
    (pathname: string) => {
      if (!state.role) return false;
      if (state.permissions) {
        const routePerm: Record<string, DashboardPermission> = {
          "/dashboard": "dashboard",
          "/dashboard/reservations": "reservations",
          "/dashboard/calendar": "calendar",
          "/dashboard/menu": "menu",
          "/dashboard/tables": "tables",
          "/dashboard/customers": "customers",
          "/dashboard/settings": "settings",
          "/dashboard/staff": "staff",
          "/dashboard/payments": "payments",
        };
        const perm = routePerm[pathname];
        return !perm || state.permissions.includes(perm);
      }
      return canAccessRouteFallback(state.role, pathname);
    },
    [state.role, state.permissions]
  );

  const fetchWithAuth = useCallback(async (url: string, init?: RequestInit) => {
    const {
      data: { session },
    } = await supabaseBrowser.auth.getSession();
    const token = session?.access_token ?? "";
    return fetch(url, {
      ...init,
      headers: {
        ...init?.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  }, []);

  const value: DashboardAuthContextValue = {
    ...state,
    can,
    visibleSidebarLinks,
    canAccessRoute: canAccessRouteForRole,
    fetchWithAuth,
    refetch: fetchSession,
  };

  return (
    <DashboardAuthContext.Provider value={value}>
      {children}
    </DashboardAuthContext.Provider>
  );
}

export function useDashboardAuth() {
  const ctx = useContext(DashboardAuthContext);
  if (!ctx) {
    throw new Error("useDashboardAuth must be used within DashboardAuthProvider");
  }
  return ctx;
}

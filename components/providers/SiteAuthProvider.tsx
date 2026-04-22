"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase-browser";

type SiteAuthState = {
  user: User | null;
  session: Session | null;
  isStaff: boolean;
  loading: boolean;
};

type SiteAuthContextValue = SiteAuthState & {
  signOut: () => Promise<void>;
  refetch: () => Promise<void>;
  fetchWithAuth: (url: string, init?: RequestInit) => Promise<Response>;
};

const SiteAuthContext = createContext<SiteAuthContextValue | null>(null);

export function SiteAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SiteAuthState>({
    user: null,
    session: null,
    isStaff: false,
    loading: true,
  });

  const checkStaff = useCallback(async (token: string | null) => {
    if (!token) return false;
    try {
      const res = await fetch("/api/auth/me", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();
      const user = session?.user ?? null;
      const staff = user ? await checkStaff(session?.access_token ?? null) : false;
      setState({ user, session, isStaff: staff, loading: false });
    } catch {
      setState({ user: null, session: null, isStaff: false, loading: false });
    }
  }, [checkStaff]);

  useEffect(() => {
    void refresh();
    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange(() => {
      void refresh();
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [refresh]);

  const signOut = useCallback(async () => {
    await supabaseBrowser.auth.signOut();
    await refresh();
  }, [refresh]);

  const fetchWithAuth = useCallback(
    async (url: string, init?: RequestInit) => {
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
    },
    []
  );

  return (
    <SiteAuthContext.Provider
      value={{ ...state, signOut, refetch: refresh, fetchWithAuth }}
    >
      {children}
    </SiteAuthContext.Provider>
  );
}

export function useSiteAuth() {
  const ctx = useContext(SiteAuthContext);
  if (!ctx) {
    throw new Error("useSiteAuth must be used within SiteAuthProvider");
  }
  return ctx;
}

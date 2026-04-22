"use client";

/**
 * SiteContentProvider — carga el contenido editable de la web desde
 * /api/public/site-content y lo expone vía context. Los componentes usan
 * useSiteContent(key) y reciben siempre un objeto válido (mergeado con
 * defaults). Mientras carga, entrega defaults para que no parpadee el layout.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  SITE_CONTENT_DEFAULTS,
  type SiteContentMap,
  type SiteSectionKey,
} from "@/lib/site-content";

type Ctx = {
  content: SiteContentMap;
  loaded: boolean;
};

const SiteContentContext = createContext<Ctx>({
  content: SITE_CONTENT_DEFAULTS,
  loaded: false,
});

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContentMap>(SITE_CONTENT_DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/public/site-content", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data?.content && typeof data.content === "object") {
          setContent(data.content as SiteContentMap);
        }
      } catch {
        // Silencioso: se queda con defaults.
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ content, loaded }), [content, loaded]);

  return (
    <SiteContentContext.Provider value={value}>
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent<K extends SiteSectionKey>(
  section: K
): SiteContentMap[K] {
  const ctx = useContext(SiteContentContext);
  return ctx.content[section];
}

export function useSiteContentLoaded(): boolean {
  return useContext(SiteContentContext).loaded;
}

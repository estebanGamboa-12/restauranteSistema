"use client";

/**
 * Smooth scroll desactivado por petición del usuario.
 *
 * Este provider mantiene la API (useLenis) para no romper imports, pero
 * ya no inicializa Lenis ni toca el scroll del navegador. Solo se encarga
 * de registrar el plugin ScrollTrigger de GSAP en cliente.
 *
 * useLenis() devuelve siempre null; los consumidores usan `lenis?.scrollTo`
 * con fallback a scrollIntoView/window.scrollTo, así que todo sigue funcionando
 * con scroll nativo.
 */

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { registerScrollTrigger } from "@/lib/gsap";

type NoopLenis = null;

const LenisContext = createContext<NoopLenis>(null);

export function useLenis(): NoopLenis {
  return useContext(LenisContext);
}

interface SmoothScrollProviderProps {
  children: ReactNode;
}

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  useEffect(() => {
    registerScrollTrigger();
  }, []);

  return <LenisContext.Provider value={null}>{children}</LenisContext.Provider>;
}

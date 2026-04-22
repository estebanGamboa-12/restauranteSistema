"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  // Nota: evitamos AnimatePresence aquí porque en algunos entornos/dev puede
  // provocar “apilado” de pantallas al navegar (duplicados en el DOM).
  // La key fuerza un remount limpio por ruta.
  return (
    <div key={pathname} className="min-h-screen">
      {children}
    </div>
  );
}

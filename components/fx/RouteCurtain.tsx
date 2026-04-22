"use client";

/**
 * RouteCurtain: overlay corto que se ejecuta al cambiar de ruta para dar
 * sensación de transición entre páginas (estilo Awwwards). Barre de arriba
 * abajo y libera al completar. Reemplaza al PageTransition simple.
 */

import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";

interface RouteCurtainProps {
  children: ReactNode;
}

export function RouteCurtain({ children }: RouteCurtainProps) {
  const pathname = usePathname();
  const curtainRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    const curtain = curtainRef.current;
    const label = labelRef.current;
    if (!curtain || !label) return;

    if (!mounted.current) {
      mounted.current = true;
      // primera carga: no mostrar cortina (la IntroLoader hace su show).
      gsap.set(curtain, { yPercent: -100 });
      gsap.set(label, { opacity: 0, yPercent: 20 });
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: "power4.inOut" } });
    tl.set(curtain, { yPercent: 100 })
      .to(curtain, { yPercent: 0, duration: 0.55 })
      .fromTo(label, { opacity: 0, yPercent: 20 }, { opacity: 1, yPercent: 0, duration: 0.3 }, "<0.05")
      .to(label, { opacity: 0, yPercent: -20, duration: 0.3 }, "+=0.15")
      .to(curtain, { yPercent: -100, duration: 0.6 }, "<0.05");

    return () => {
      tl.kill();
    };
  }, [pathname]);

  return (
    <>
      <div
        ref={curtainRef}
        className="pointer-events-none fixed inset-0 z-[900] flex items-center justify-center bg-xalisco-black"
        style={{ transform: "translateY(-100%)" }}
        aria-hidden
      >
        <div
          ref={labelRef}
          className="font-display text-4xl font-semibold uppercase tracking-[0.2em] text-xalisco-cream sm:text-6xl"
        >
          <span className="text-xalisco-gold-bright">Paco&apos;s</span> Food
        </div>
      </div>
      <div key={pathname} className="min-h-screen">
        {children}
      </div>
    </>
  );
}

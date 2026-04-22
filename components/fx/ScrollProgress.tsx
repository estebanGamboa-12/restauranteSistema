"use client";

/**
 * Barra de progreso de scroll fija arriba. Lee directamente el scroll global
 * (sirve para Lenis + nativo) y escala la barra con GPU transform.
 */

import { useEffect, useRef } from "react";

export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const bar = barRef.current;
    if (!bar) return;

    let raf = 0;
    const update = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      const progress = total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0;
      bar.style.transform = `scaleX(${progress})`;
      raf = 0;
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[85] h-[2px] bg-transparent"
    >
      <div
        ref={barRef}
        className="h-full origin-left bg-gradient-to-r from-xalisco-burnt-orange via-xalisco-gold-bright to-xalisco-burnt-orange"
        style={{ transform: "scaleX(0)", willChange: "transform" }}
      />
    </div>
  );
}

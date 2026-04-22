"use client";

/**
 * Cursor custom estilo Awwwards: anillo grande que sigue al puntero con lag y un
 * punto central pegado al puntero real. Cambia de estado al hacer hover en
 * elementos con `data-cursor="grow" | "text" | "hide"`.
 * - No se monta en dispositivos táctiles.
 * - Respeta `prefers-reduced-motion`.
 */

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!dot || !ring) return;

    const qxDot = gsap.quickTo(dot, "x", { duration: 0.05, ease: "power3" });
    const qyDot = gsap.quickTo(dot, "y", { duration: 0.05, ease: "power3" });
    const qxRing = gsap.quickTo(ring, "x", { duration: 0.4, ease: "power3" });
    const qyRing = gsap.quickTo(ring, "y", { duration: 0.4, ease: "power3" });

    const onMove = (e: MouseEvent) => {
      qxDot(e.clientX);
      qyDot(e.clientY);
      qxRing(e.clientX);
      qyRing(e.clientY);
    };

    const hoverSelector =
      'a, button, [role="button"], input, textarea, select, label, [data-cursor]';

    const onOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest(hoverSelector) as HTMLElement | null;
      if (!target) return;
      const kind = target.getAttribute("data-cursor") ?? "grow";
      const text = target.getAttribute("data-cursor-label");
      if (kind === "hide") {
        gsap.to([ring, dot], { opacity: 0, duration: 0.2 });
        return;
      }
      gsap.to(ring, {
        scale: kind === "text" ? 2.6 : 1.8,
        backgroundColor: kind === "text" ? "var(--xalisco-burnt-orange)" : "transparent",
        borderColor: "var(--xalisco-burnt-orange)",
        duration: 0.35,
        ease: "power3.out",
      });
      gsap.to(dot, { opacity: kind === "text" ? 0 : 0.9, duration: 0.2 });
      if (label) {
        label.textContent = text ?? "";
        gsap.to(label, { opacity: text ? 1 : 0, duration: 0.2 });
      }
    };
    const onOut = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest(hoverSelector);
      if (!target) return;
      gsap.to(ring, {
        scale: 1,
        backgroundColor: "transparent",
        borderColor: "var(--xalisco-cream)",
        duration: 0.4,
        ease: "power3.out",
      });
      gsap.to(dot, { opacity: 1, duration: 0.2 });
      gsap.to([ring, dot], { opacity: 1, duration: 0.2 });
      if (label) {
        gsap.to(label, {
          opacity: 0,
          duration: 0.15,
          onComplete: () => {
            label.textContent = "";
          },
        });
      }
    };

    const onDown = () => gsap.to(ring, { scale: 0.7, duration: 0.2 });
    const onUp = () => gsap.to(ring, { scale: 1, duration: 0.3 });

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    window.addEventListener("mouseout", onOut);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mouseout", onOut);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] -translate-x-1/2 -translate-y-1/2 rounded-full border border-xalisco-cream/90 mix-blend-difference"
        style={{ width: 40, height: 40 }}
      >
        <span
          ref={labelRef}
          className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold uppercase tracking-[0.18em] text-xalisco-black opacity-0"
        />
      </div>
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] -translate-x-1/2 -translate-y-1/2 rounded-full bg-xalisco-gold-bright mix-blend-difference"
        style={{ width: 6, height: 6 }}
      />
    </>
  );
}

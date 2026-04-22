"use client";

/**
 * IntroLoader: overlay a pantalla completa que se muestra en la primera visita
 * (o en cada carga de `/`). Desvela el contenido con un efecto de "curtain" y
 * tipografía grande. Solo se ejecuta una vez por sesión para no estorbar.
 */

import { useEffect, useRef, useState } from "react";
import { useGSAP, gsap } from "@/lib/gsap";

const INTRO_KEY = "pacos-intro-played";

export function IntroLoader() {
  // Siempre arrancamos false en SSR para evitar hydration mismatch.
  // En cliente, tras montar, decidimos si toca mostrar la intro.
  const [visible, setVisible] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.sessionStorage.getItem(INTRO_KEY)) {
      setVisible(true);
    } else {
      // Intro ya vista: disparamos el evento para que el hero arranque.
      window.dispatchEvent(new CustomEvent("pacos:intro-done"));
    }
  }, []);

  useGSAP(
    () => {
      if (!visible) return;
      const root = rootRef.current;
      if (!root) return;

      // Bloqueamos scroll mientras la intro está activa.
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const tl = gsap.timeline({
        defaults: { ease: "power4.inOut" },
        onComplete: () => {
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem(INTRO_KEY, "1");
          }
          setVisible(false);
          document.body.style.overflow = prevOverflow;
          window.dispatchEvent(new CustomEvent("pacos:intro-done"));
        },
      });

      tl.fromTo(
        "[data-intro-word]",
        { yPercent: 120 },
        { yPercent: 0, duration: 0.9, stagger: 0.1, ease: "power4.out" }
      )
        .to("[data-intro-line]", { scaleX: 1, duration: 0.9 }, "<0.2")
        .to("[data-intro-word]", { yPercent: -120, duration: 0.8, stagger: 0.05 }, "+=0.6")
        .to("[data-intro-panel]", { yPercent: -100, duration: 1.1 }, "<0.15")
        .set(root, { display: "none" });

      return () => {
        tl.kill();
        document.body.style.overflow = prevOverflow;
      };
    },
    { scope: rootRef, dependencies: [visible] }
  );

  if (!visible) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[1000] overflow-hidden bg-xalisco-black text-xalisco-cream"
      aria-hidden
    >
      <div
        data-intro-panel
        className="absolute inset-0 flex flex-col items-center justify-center gap-8 bg-xalisco-black"
      >
        <div className="flex items-baseline gap-3 overflow-hidden font-display text-5xl font-semibold tracking-tight sm:text-7xl md:text-8xl">
          <span className="overflow-hidden">
            <span data-intro-word className="inline-block">
              Paco&apos;s
            </span>
          </span>
          <span className="overflow-hidden text-xalisco-gold-bright">
            <span data-intro-word className="inline-block italic">
              Food
            </span>
          </span>
        </div>
        <div className="relative h-[2px] w-[240px] overflow-hidden md:w-[320px]">
          <div
            data-intro-line
            className="absolute inset-0 origin-left scale-x-0 bg-xalisco-burnt-orange"
          />
        </div>
        <div className="overflow-hidden">
          <span
            data-intro-word
            className="inline-block text-xs uppercase tracking-[0.4em] text-xalisco-cream/70 sm:text-sm"
          >
            Almonte · Huelva · Desde siempre
          </span>
        </div>
      </div>
    </div>
  );
}

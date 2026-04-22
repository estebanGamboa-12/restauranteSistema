"use client";

/**
 * AmbientSection: una "página" dentro de la home con una imagen enorme que hace
 * zoom-in al scroll (clip-path) + copy a un lado.
 */

import Link from "next/link";
import { useRef } from "react";
import { useGSAP, gsap } from "@/lib/gsap";

export function AmbientSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;
      const image = section.querySelector<HTMLElement>("[data-ambient-media]");
      if (!image) return;

      gsap.fromTo(
        image,
        { clipPath: "inset(20% 20% 20% 20% round 24px)" },
        {
          clipPath: "inset(0% 0% 0% 0% round 0px)",
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top 70%",
            end: "bottom top",
            scrub: true,
          },
        }
      );

      gsap.to(image, {
        scale: 1.1,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-t border-xalisco-cream/10 bg-xalisco-black text-xalisco-cream"
    >
      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-24 sm:px-8 md:grid-cols-12 md:gap-16 md:py-32 lg:px-12">
        <div className="md:col-span-5">
          <p className="text-[10px] uppercase tracking-[0.35em] text-xalisco-gold-bright/85">
            <span className="mr-3 inline-block h-px w-8 align-middle bg-xalisco-gold-bright/70" />
            El local
          </p>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-[0.95] tracking-tight sm:text-5xl md:text-6xl">
            Un sitio<br />para volver.
          </h2>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-xalisco-cream/70 md:text-base">
            Luz cálida, mesas de madera, música baja. El tipo de sitio al que
            vienes a comer sin mirar el reloj.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/rooftop"
              data-cursor="grow"
              className="group inline-flex items-center gap-2 rounded-full border border-xalisco-cream/30 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-xalisco-cream transition-colors hover:border-xalisco-gold-bright/60 hover:text-xalisco-gold-bright"
            >
              Ver el local
              <span className="transition-transform group-hover:translate-x-1" aria-hidden>
                →
              </span>
            </Link>
          </div>
        </div>

        <div className="md:col-span-7">
          <div
            data-ambient-media
            className="relative aspect-[4/5] w-full overflow-hidden bg-cover bg-center"
            style={{
              backgroundImage: "url(/localnoche.jpg)",
              clipPath: "inset(20% 20% 20% 20% round 24px)",
            }}
          />
          <div className="mt-6 flex items-start justify-between text-[10px] uppercase tracking-[0.3em] text-xalisco-cream/50">
            <span>Almonte — Huelva</span>
            <span>36° 14&apos; N · 6° 31&apos; W</span>
          </div>
        </div>
      </div>
    </section>
  );
}

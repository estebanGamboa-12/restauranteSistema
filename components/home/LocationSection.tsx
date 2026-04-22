"use client";

/**
 * Sección "Dónde estamos" rediseñada: mapa a la derecha con borde
 * redondeado + coordenadas / horario / dirección tipo ficha editorial.
 */

import { useRef } from "react";
import { useGSAP, gsap } from "@/lib/gsap";
import { SITE_CONTACT } from "@/lib/site-contact";
import { useSiteContent } from "@/components/providers/SiteContentProvider";

export function LocationSection() {
  const content = useSiteContent("home.location");
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;
      gsap.fromTo(
        section.querySelectorAll("[data-loc-line]"),
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: section, start: "top 75%" },
        }
      );
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-t border-xalisco-cream/10 bg-xalisco-black-soft/70 py-24 text-xalisco-cream md:py-32"
    >
      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 sm:px-8 md:grid-cols-12 md:gap-16 lg:px-12">
        <div className="md:col-span-5 flex flex-col gap-6">
          <p data-loc-line className="text-[10px] uppercase tracking-[0.35em] text-xalisco-gold-bright/85">
            <span className="mr-3 inline-block h-px w-8 align-middle bg-xalisco-gold-bright/70" />
            {content.eyebrow}
          </p>
          <h2
            data-loc-line
            className="font-display text-4xl font-semibold leading-[0.95] tracking-tight sm:text-5xl md:text-6xl"
          >
            {content.title}
          </h2>

          <ul className="mt-4 divide-y divide-xalisco-cream/10 border-y border-xalisco-cream/10 text-sm">
            <li data-loc-line className="flex items-start justify-between gap-6 py-4">
              <span className="text-[10px] uppercase tracking-[0.28em] text-xalisco-cream/50">
                Dirección
              </span>
              <span className="text-right text-xalisco-cream/90">
                {content.address}
                <br />
                <span className="text-xalisco-cream/60">{content.city}</span>
              </span>
            </li>
            <li data-loc-line className="flex items-start justify-between gap-6 py-4">
              <span className="text-[10px] uppercase tracking-[0.28em] text-xalisco-cream/50">
                Teléfono
              </span>
              <a
                href={`tel:${content.phone.replace(/\s+/g, "")}`}
                className="text-right text-xalisco-gold-bright"
                data-cursor="grow"
              >
                {content.phone}
              </a>
            </li>
            <li data-loc-line className="flex items-start justify-between gap-6 py-4">
              <span className="text-[10px] uppercase tracking-[0.28em] text-xalisco-cream/50">
                Horario
              </span>
              <span className="text-right text-xalisco-cream/90">
                {content.hours_weekdays}
                <br />
                <span className="text-xalisco-cream/60">{content.hours_weekend}</span>
              </span>
            </li>
          </ul>

          <a
            data-loc-line
            href={SITE_CONTACT.googleMapsSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="grow"
            className="group inline-flex items-center gap-2 self-start rounded-full border border-xalisco-cream/30 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-xalisco-cream transition-colors hover:border-xalisco-gold-bright/60 hover:text-xalisco-gold-bright"
          >
            Abrir en Google Maps
            <span className="transition-transform group-hover:translate-x-1" aria-hidden>
              ↗
            </span>
          </a>
        </div>

        <div className="md:col-span-7">
          <div
            data-loc-line
            className="relative overflow-hidden rounded-3xl border border-xalisco-cream/10 bg-xalisco-black/80"
          >
            <iframe
              title={`Mapa ${SITE_CONTACT.brandLine}`}
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                content.map_query || SITE_CONTACT.addressOneLine
              )}&output=embed`}
              className="h-[360px] w-full border-0 md:h-[480px] lg:h-[560px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

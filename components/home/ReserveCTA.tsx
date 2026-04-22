"use client";

/**
 * CTA de reservas fullscreen. Imagen de fondo fija, texto gigante con hover
 * que revela un "VER MÁS" rotando. Scroll-pin corto para aumentar presencia.
 */

import Link from "next/link";
import { useRef } from "react";
import { useGSAP, gsap } from "@/lib/gsap";
import { Magnetic } from "@/components/fx/Magnetic";
import { SITE_CONTACT } from "@/lib/site-contact";
import { useSiteContent } from "@/components/providers/SiteContentProvider";

export function ReserveCTA() {
  const content = useSiteContent("home.reserve_cta");
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;
      const bg = section.querySelector<HTMLElement>("[data-reserve-bg]");
      const words = section.querySelectorAll<HTMLElement>("[data-reserve-word]");

      if (bg) {
        gsap.to(bg, {
          yPercent: 20,
          scale: 1.1,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      }

      if (words.length) {
        gsap.fromTo(
          words,
          { yPercent: 120 },
          {
            yPercent: 0,
            duration: 1.1,
            ease: "power4.out",
            stagger: 0.08,
            scrollTrigger: { trigger: section, start: "top 75%" },
          }
        );
      }
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[90svh] items-center overflow-hidden border-t border-xalisco-cream/10 bg-xalisco-black text-xalisco-cream"
    >
      <div
        data-reserve-bg
        className="absolute inset-0 bg-cover bg-center will-change-transform"
        style={{ backgroundImage: `url(${content.image_url})` }}
      />
      <div
        className="absolute inset-0 bg-gradient-to-tr from-xalisco-black/92 via-xalisco-black/60 to-xalisco-black/90"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(247,236,211,0.3) 0 1px, transparent 1px 80px)",
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col gap-10 px-5 py-24 sm:px-8 lg:px-12">
        <p className="text-[10px] uppercase tracking-[0.35em] text-xalisco-gold-bright/85">
          <span className="mr-3 inline-block h-px w-8 align-middle bg-xalisco-gold-bright/70" />
          {content.eyebrow}
        </p>
        <h2
          className="font-display text-[16vw] leading-[0.9] font-semibold tracking-[-0.03em] sm:text-[12vw] lg:text-[9.5vw]"
          aria-label={`${content.title_line_1} ${content.title_line_2}`}
        >
          <span className="block overflow-hidden">
            <span data-reserve-word className="inline-block">
              {content.title_line_1}
            </span>
          </span>
          <span className="block overflow-hidden">
            <span data-reserve-word className="inline-block italic text-xalisco-gold-bright">
              {content.title_line_2}
            </span>
          </span>
        </h2>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <p className="max-w-md text-sm leading-relaxed text-xalisco-cream/75 md:text-base">
            {content.subtitle}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Magnetic>
              <Link
                href={content.cta_href}
                data-cursor="grow"
                data-cursor-label="Reservar"
                className="group inline-flex items-center gap-2 overflow-hidden rounded-full bg-xalisco-burnt-orange px-6 py-3.5 text-sm font-semibold text-xalisco-black transition-colors"
              >
                <span className="relative z-10">{content.cta_label}</span>
                <span className="relative z-10 transition-transform group-hover:translate-x-1" aria-hidden>
                  →
                </span>
              </Link>
            </Magnetic>
            <Link
              href={SITE_CONTACT.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="grow"
              className="inline-flex items-center gap-2 rounded-full border border-xalisco-cream/30 px-6 py-3.5 text-sm font-semibold text-xalisco-cream transition-colors hover:border-xalisco-gold-bright/60 hover:text-xalisco-gold-bright"
            >
              WhatsApp
              <span aria-hidden>↗</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

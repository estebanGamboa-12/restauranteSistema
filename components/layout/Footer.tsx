"use client";

/**
 * Footer cinematográfico: marquee + logotipo gigante que se reveal al scroll,
 * grid de enlaces y créditos. Se siente como el "fin de capítulo".
 */

import Link from "next/link";
import { useRef } from "react";
import { MapPin, Phone } from "lucide-react";
import { useGSAP, gsap } from "@/lib/gsap";
import { Marquee } from "@/components/fx/Marquee";
import { Magnetic } from "@/components/fx/Magnetic";
import { SITE_CONTACT } from "@/lib/site-contact";
import { useSiteContent } from "@/components/providers/SiteContentProvider";

const FOOTER_NAV = [
  { href: "/menu", label: "Carta" },
  { href: "/rooftop", label: "El local" },
  { href: "/reservas", label: "Reservas" },
  { href: "/contacto", label: "Contacto" },
  { href: "/privacidad", label: "Privacidad" },
];

export function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const content = useSiteContent("footer");
  const location = useSiteContent("home.location");

  useGSAP(
    () => {
      const el = footerRef.current;
      if (!el) return;
      const logo = el.querySelector<HTMLElement>("[data-footer-logo]");
      if (!logo) return;
      const chars = logo.querySelectorAll<HTMLElement>("[data-footer-char]");
      gsap.fromTo(
        chars,
        { yPercent: 110 },
        {
          yPercent: 0,
          duration: 1.1,
          stagger: 0.04,
          ease: "power4.out",
          scrollTrigger: { trigger: logo, start: "top 85%" },
        }
      );
    },
    { scope: footerRef }
  );

  const logoText = content.big_logo || "PACO'S FOOD";
  const marqueeWords =
    content.marquee_words && content.marquee_words.length
      ? content.marquee_words
      : ["Reservas abiertas", "Almonte · Huelva", "Cocina casera", "Producto fresco", "Desde siempre"];

  return (
    <footer
      ref={footerRef}
      className="relative overflow-hidden border-t border-xalisco-cream/10 bg-xalisco-black text-xalisco-cream"
    >
      <div className="border-y border-xalisco-cream/10 py-6">
        <Marquee speed={70} className="text-xalisco-cream/75">
          {marqueeWords.map((w, i) => (
            <span
              key={i}
              className="mx-6 inline-flex items-center gap-6 font-display text-2xl font-medium tracking-tight sm:text-3xl md:text-4xl"
            >
              {w}
              <span className="text-xalisco-burnt-orange" aria-hidden>
                ✦
              </span>
            </span>
          ))}
        </Marquee>
      </div>

      <div className="mx-auto max-w-[1400px] px-5 pt-20 sm:px-8 md:pt-28 lg:px-12">
        <div className="grid gap-16 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-7 lg:col-span-6 flex flex-col gap-8">
            <p className="text-[10px] uppercase tracking-[0.35em] text-xalisco-gold-bright/85">
              <span className="mr-3 inline-block h-px w-8 align-middle bg-xalisco-gold-bright/70" />
              Hasta pronto
            </p>
            <h3 className="font-display text-4xl font-semibold leading-[0.95] tracking-tight sm:text-5xl md:text-6xl">
              Reserva tu mesa y pásate a comer.
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <Magnetic>
                <Link
                  href="/reservas"
                  data-cursor="grow"
                  data-cursor-label="Reservar"
                  className="group inline-flex items-center gap-2 rounded-full bg-xalisco-burnt-orange px-6 py-3.5 text-sm font-semibold text-xalisco-black transition-colors"
                >
                  Reservar online
                  <span className="transition-transform group-hover:translate-x-1" aria-hidden>
                    →
                  </span>
                </Link>
              </Magnetic>
              <Link
                href={SITE_CONTACT.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="grow"
                className="inline-flex items-center gap-2 rounded-full border border-xalisco-cream/30 px-6 py-3.5 text-sm font-semibold transition-colors hover:border-xalisco-gold-bright/60 hover:text-xalisco-gold-bright"
              >
                WhatsApp
                <span aria-hidden>↗</span>
              </Link>
            </div>
          </div>

          <div className="md:col-span-5 lg:col-span-6 grid grid-cols-2 gap-8">
            <div>
              <h4 className="text-[10px] uppercase tracking-[0.28em] text-xalisco-cream/50">
                Navegar
              </h4>
              <ul className="mt-4 space-y-2 text-sm">
                {FOOTER_NAV.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      data-cursor="grow"
                      className="group inline-flex items-center gap-2 text-xalisco-cream transition-colors hover:text-xalisco-gold-bright"
                    >
                      <span className="inline-block h-px w-0 bg-current transition-all duration-500 group-hover:w-6" />
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] uppercase tracking-[0.28em] text-xalisco-cream/50">
                Contacto
              </h4>
              <div className="mt-4 space-y-3 text-sm">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    location.map_query || SITE_CONTACT.addressOneLine
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="grow"
                  className="flex items-start gap-2 text-xalisco-cream hover:text-xalisco-gold-bright"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-xalisco-gold-bright" />
                  <span className="leading-snug">
                    {location.address}
                    <br />
                    {location.city}
                  </span>
                </a>
                <a
                  href={`tel:${location.phone.replace(/\s+/g, "")}`}
                  data-cursor="grow"
                  className="flex items-center gap-2 text-xalisco-cream hover:text-xalisco-gold-bright"
                >
                  <Phone className="h-4 w-4 shrink-0 text-xalisco-gold-bright" />
                  {location.phone}
                </a>
                <p className="text-xalisco-cream/60">{location.hours_weekdays}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-24 overflow-hidden md:mt-32">
          <div
            data-footer-logo
            aria-hidden
            className="flex justify-center whitespace-nowrap font-display font-semibold leading-none tracking-[-0.05em]"
            style={{ fontSize: "clamp(80px, 20vw, 260px)" }}
          >
            {logoText.split("").map((c, i) => (
              <span key={i} className="overflow-hidden inline-block">
                <span
                  data-footer-char
                  className={`inline-block ${
                    c === "'" || c === " " ? "text-xalisco-gold-bright" : ""
                  }`}
                >
                  {c === " " ? "\u00A0" : c}
                </span>
              </span>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-xalisco-cream/10 py-6 text-[11px] uppercase tracking-[0.2em] text-xalisco-cream/50 md:flex-row md:items-center md:justify-between">
          <p>{content.copyright || `© ${new Date().getFullYear()} Paco's Food · Almonte · Huelva`}</p>
          <p className="md:text-right">
            Diseño{" "}
            <a
              href="https://esteban-dev.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xalisco-gold-bright hover:underline"
              data-cursor="grow"
            >
              esteban-dev
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

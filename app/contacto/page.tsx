"use client";

import Link from "next/link";
import { useRef } from "react";
import { ExternalLink, MapPin, Phone, Clock } from "lucide-react";
import { useGSAP, gsap } from "@/lib/gsap";
import { Magnetic } from "@/components/fx/Magnetic";
import { SITE_CONTACT } from "@/lib/site-contact";

export default function ContactoPage() {
  const pageRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = pageRef.current;
      if (!root) return;
      const words = root.querySelectorAll<HTMLElement>("[data-contact-word]");
      const lines = root.querySelectorAll<HTMLElement>("[data-contact-line]");

      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
      tl.fromTo(words, { yPercent: 120 }, { yPercent: 0, duration: 1.1, stagger: 0.1 })
        .fromTo(lines, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.05 }, "<0.2");
    },
    { scope: pageRef }
  );

  return (
    <div ref={pageRef} className="-mt-16 min-h-screen bg-xalisco-black text-xalisco-cream lg:-mt-20">
      <section className="relative flex min-h-[75svh] items-end overflow-hidden pt-32 pb-12 md:pt-44 md:pb-20">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35"
          style={{ backgroundImage: "url(/localnoche.jpg)" }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-xalisco-black via-xalisco-black/40 to-xalisco-black"
          aria-hidden
        />
        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <p
            data-contact-line
            className="text-[10px] uppercase tracking-[0.35em] text-xalisco-gold-bright/85"
          >
            <span className="mr-3 inline-block h-px w-8 align-middle bg-xalisco-gold-bright/70" />
            Contacto
          </p>
          <h1
            aria-label="Hablemos"
            className="mt-6 font-display text-[18vw] leading-[0.88] font-semibold tracking-[-0.04em] sm:text-[14vw] lg:text-[11vw]"
          >
            <span className="block overflow-hidden">
              <span data-contact-word className="inline-block">Hablemos</span>
            </span>
            <span className="block overflow-hidden">
              <span data-contact-word className="inline-block italic text-xalisco-gold-bright">
                tranquilamente.
              </span>
            </span>
          </h1>
          <p
            data-contact-line
            className="mt-8 max-w-xl text-sm leading-relaxed text-xalisco-cream/75 md:text-base"
          >
            Reservas, encargos o cualquier consulta — llámanos, escríbenos por WhatsApp o pásate
            por el local.
          </p>
        </div>
      </section>

      {/* Grid info + horario */}
      <section className="relative border-t border-xalisco-cream/10 py-20 md:py-28">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-5 sm:px-8 md:grid-cols-12 md:gap-12 lg:px-12">
          <div data-contact-line className="md:col-span-5 flex flex-col gap-4">
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Direcciones & contacto
            </h2>
            <p className="text-sm text-xalisco-cream/70">
              Te esperamos en Almonte. Elige el canal que prefieras para cualquier cosa.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <Magnetic>
                <Link
                  href="/reservas"
                  data-cursor="grow"
                  data-cursor-label="Reservar"
                  className="group inline-flex items-center gap-2 self-start rounded-full bg-xalisco-burnt-orange px-6 py-3 text-sm font-semibold text-xalisco-black"
                >
                  Reservar mesa
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
                className="inline-flex items-center gap-2 self-start rounded-full border border-xalisco-cream/30 px-6 py-3 text-sm font-semibold text-xalisco-cream transition-colors hover:border-xalisco-gold-bright/60 hover:text-xalisco-gold-bright"
              >
                Abrir WhatsApp
                <ExternalLink className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="md:col-span-7 grid gap-4 sm:grid-cols-2">
            <ContactCard
              icon={<MapPin className="h-5 w-5" />}
              title="Dirección"
              body={
                <a
                  href={SITE_CONTACT.googleMapsSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xalisco-cream hover:text-xalisco-gold-bright"
                >
                  {SITE_CONTACT.streetLine}
                  <br />
                  {SITE_CONTACT.cityLine}
                </a>
              }
            />
            <ContactCard
              icon={<Phone className="h-5 w-5" />}
              title="Teléfono"
              body={
                <a
                  href={SITE_CONTACT.telHref}
                  className="text-xalisco-gold-bright hover:underline"
                >
                  +34 {SITE_CONTACT.phoneLocal}
                </a>
              }
            />
            <ContactCard
              icon={<Clock className="h-5 w-5" />}
              title="Horario"
              body={<span className="text-xalisco-cream/80">{SITE_CONTACT.hoursSummary}</span>}
            />
            <ContactCard
              icon={<ExternalLink className="h-5 w-5" />}
              title="WhatsApp"
              body={
                <a
                  href={SITE_CONTACT.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xalisco-cream hover:text-xalisco-gold-bright"
                >
                  Chatear ahora
                </a>
              }
            />
          </div>
        </div>
      </section>

      {/* Horario detallado */}
      <section className="relative border-t border-xalisco-cream/10 bg-xalisco-black-soft/70 py-20 md:py-28">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 sm:px-8 md:grid-cols-12 md:gap-16 lg:px-12">
          <div data-contact-line className="md:col-span-5">
            <p className="text-[10px] uppercase tracking-[0.35em] text-xalisco-gold-bright/85">
              <span className="mr-3 inline-block h-px w-8 align-middle bg-xalisco-gold-bright/70" />
              Horario
            </p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-5xl">
              Cuándo nos<br />
              <span className="italic text-xalisco-gold-bright">encontrarás</span>.
            </h2>
            <p className="mt-4 max-w-sm text-sm text-xalisco-cream/70">
              Horario según Google Maps. Puede variar en festivos — confirma por WhatsApp si vas a
              venir un día señalado.
            </p>
          </div>
          <div data-contact-line className="md:col-span-7">
            <ul className="divide-y divide-xalisco-cream/10 border-y border-xalisco-cream/10 text-sm">
              {SITE_CONTACT.openingHours.map((row) => (
                <li
                  key={row.day}
                  className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                >
                  <span className="text-[10px] uppercase tracking-[0.28em] text-xalisco-cream/55">
                    {row.day}
                  </span>
                  <span className="font-display text-lg text-xalisco-cream md:text-xl">
                    {row.slots.join(" · ")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Mapa grande */}
      <section className="relative border-t border-xalisco-cream/10 py-20 md:py-28">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <div
            data-contact-line
            className="overflow-hidden rounded-3xl border border-xalisco-cream/10 bg-xalisco-black-soft"
          >
            <iframe
              title={`Mapa ${SITE_CONTACT.brandLine}`}
              src={SITE_CONTACT.googleMapsEmbedUrl}
              className="h-[380px] w-full border-0 md:h-[520px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="mt-6 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-xalisco-cream/50">
            <span>Almonte — Huelva</span>
            <a
              href={SITE_CONTACT.googleMapsSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="grow"
              className="inline-flex items-center gap-2 text-xalisco-gold-bright hover:underline"
            >
              Abrir en Maps
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function ContactCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <div
      data-contact-line
      data-cursor="grow"
      className="group relative overflow-hidden rounded-3xl border border-xalisco-cream/10 bg-xalisco-black-soft/60 p-6 transition-colors hover:border-xalisco-gold-bright/40"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-xalisco-black text-xalisco-gold-bright">
          {icon}
        </span>
        <h3 className="text-[10px] uppercase tracking-[0.28em] text-xalisco-cream/55">{title}</h3>
      </div>
      <div className="mt-4 font-display text-xl leading-snug">{body}</div>
      <span
        className="absolute inset-x-6 bottom-4 h-px origin-left scale-x-0 bg-xalisco-gold-bright transition-transform duration-500 group-hover:scale-x-100"
        aria-hidden
      />
    </div>
  );
}

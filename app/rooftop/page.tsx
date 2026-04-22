"use client";

import Link from "next/link";
import { useRef } from "react";
import { useGSAP, gsap } from "@/lib/gsap";
import { Magnetic } from "@/components/fx/Magnetic";

type GalleryItem = {
  id: number;
  src: string;
  alt: string;
  title: string;
  caption: string;
  span?: "tall" | "wide" | "square";
};

const ITEMS: GalleryItem[] = [
  { id: 1, src: "/local1.jpg", alt: "Terraza de Paco's Food", title: "Terraza", caption: "Mesa al aire libre", span: "tall" },
  { id: 2, src: "/local3.jpg", alt: "Interior de Paco's Food", title: "Interior", caption: "Luz cálida y madera" },
  { id: 3, src: "/localnoche.jpg", alt: "Vista nocturna de Paco's Food", title: "Noche", caption: "Cuando todo se ilumina", span: "wide" },
  { id: 4, src: "/local2.jpg", alt: "Detalle de mesa", title: "Detalle", caption: "Preparado al servicio" },
  { id: 5, src: "/bebida1.jpg", alt: "Cóctel de Paco's Food", title: "Bebida", caption: "Copa fría y sobremesa", span: "tall" },
  { id: 6, src: "/local3.jpg", alt: "Sobremesa", title: "Sobremesa", caption: "Tomarse el tiempo" },
];

export default function RooftopPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const hero = heroRef.current;
      if (hero) {
        const bg = hero.querySelector<HTMLElement>("[data-hero-bg]");
        const words = hero.querySelectorAll<HTMLElement>("[data-hero-word]");
        const meta = hero.querySelectorAll<HTMLElement>("[data-hero-meta]");

        const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
        tl.fromTo(words, { yPercent: 120 }, { yPercent: 0, duration: 1.1, stagger: 0.1 })
          .fromTo(meta, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 }, "<0.2");

        if (bg) {
          gsap.to(bg, {
            yPercent: 18,
            scale: 1.1,
            ease: "none",
            scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
          });
        }
      }

      // Masonry items parallax
      const tiles = pageRef.current?.querySelectorAll<HTMLElement>("[data-masonry]");
      tiles?.forEach((tile) => {
        const inner = tile.querySelector<HTMLElement>("[data-masonry-inner]");
        if (!inner) return;
        gsap.fromTo(
          tile,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: tile, start: "top 85%" },
          }
        );
        gsap.to(inner, {
          yPercent: -12,
          ease: "none",
          scrollTrigger: { trigger: tile, start: "top bottom", end: "bottom top", scrub: true },
        });
      });

      // Atmosphere copy reveal
      const blocks = pageRef.current?.querySelectorAll<HTMLElement>("[data-atmo]");
      blocks?.forEach((b, i) => {
        gsap.fromTo(
          b,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power3.out",
            delay: i * 0.05,
            scrollTrigger: { trigger: b, start: "top 85%" },
          }
        );
      });
    },
    { scope: pageRef }
  );

  return (
    <div ref={pageRef} className="-mt-16 min-h-screen bg-xalisco-black text-xalisco-cream lg:-mt-20">
      {/* HERO */}
      <section
        ref={heroRef}
        className="relative flex min-h-[100svh] items-end overflow-hidden pt-32 pb-14 md:pt-44 md:pb-20"
      >
        <div
          data-hero-bg
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/hero.jpg)" }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-xalisco-black/90 via-xalisco-black/40 to-xalisco-black"
          aria-hidden
        />
        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <p
            data-hero-meta
            className="text-[10px] uppercase tracking-[0.35em] text-xalisco-gold-bright/85"
          >
            <span className="mr-3 inline-block h-px w-8 align-middle bg-xalisco-gold-bright/70" />
            El local
          </p>
          <h1
            aria-label="El local"
            className="mt-6 font-display text-[18vw] leading-[0.88] font-semibold tracking-[-0.04em] sm:text-[14vw] lg:text-[11vw]"
          >
            <span className="block overflow-hidden">
              <span data-hero-word className="inline-block">El</span>
            </span>
            <span className="block overflow-hidden">
              <span data-hero-word className="inline-block italic text-xalisco-gold-bright">
                local.
              </span>
            </span>
          </h1>
          <div
            data-hero-meta
            className="mt-8 flex flex-col gap-6 text-sm md:flex-row md:items-end md:justify-between"
          >
            <p className="max-w-md text-xalisco-cream/75 leading-relaxed">
              Un espacio cercano en Almonte. Madera, luz baja y servicio sin prisas.
              Hecho para compartir mesa.
            </p>
            <span className="text-[11px] uppercase tracking-[0.3em] text-xalisco-cream/55">
              Scroll para ver más ↓
            </span>
          </div>
        </div>
      </section>

      {/* MASONRY EDITORIAL */}
      <section className="relative border-t border-xalisco-cream/10 py-24 md:py-32">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <header className="mb-16 grid gap-6 md:grid-cols-12 md:items-end">
            <p className="text-[10px] uppercase tracking-[0.35em] text-xalisco-gold-bright/85 md:col-span-3">
              <span className="mr-3 inline-block h-px w-8 align-middle bg-xalisco-gold-bright/70" />
              Galería
            </p>
            <h2 className="font-display text-4xl font-semibold leading-[0.95] tracking-tight sm:text-5xl md:col-span-9 md:text-6xl">
              Miradas al<br />
              <span className="italic text-xalisco-gold-bright">sitio de siempre</span>.
            </h2>
          </header>

          <div className="grid gap-5 sm:grid-cols-6 lg:grid-cols-12">
            {ITEMS.map((item, i) => {
              // Mobile: alternamos alturas y añadimos ritmo editorial
              const mobileRatio =
                i % 3 === 0
                  ? "aspect-[4/5]"
                  : i % 3 === 1
                  ? "aspect-[3/4]"
                  : "aspect-[5/4]";
              const desktopSpan =
                item.span === "tall"
                  ? "sm:col-span-3 lg:col-span-5 lg:row-span-2 sm:aspect-[3/4]"
                  : item.span === "wide"
                  ? "sm:col-span-6 lg:col-span-7 sm:aspect-[16/10]"
                  : "sm:col-span-3 lg:col-span-3 sm:aspect-[4/3]";
              // Offset horizontal alterno en mobile para no verse como un grid clásico
              const mobileOffset =
                i % 2 === 0 ? "mr-6 sm:mr-0" : "ml-6 sm:ml-0";
              return (
                <figure
                  key={item.id}
                  data-masonry
                  data-cursor="grow"
                  className={[
                    "group relative overflow-hidden rounded-3xl bg-xalisco-black-soft/60",
                    mobileRatio,
                    mobileOffset,
                    desktopSpan,
                  ].join(" ")}
                >
                  <div
                    data-masonry-inner
                    className="absolute inset-0 -top-[10%] h-[120%] bg-cover bg-center will-change-transform transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(${item.src})` }}
                    role="img"
                    aria-label={item.alt}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-xalisco-black/85 via-transparent to-transparent" />
                  {/* Numeración editorial gigante (solo mobile/tablet, super visual) */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute right-3 top-2 font-display text-[22vw] font-semibold leading-none tracking-[-0.05em] text-xalisco-cream/10 sm:text-[10vw] lg:hidden"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <figcaption className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.25em] text-xalisco-gold-bright/90">
                        {item.caption}
                      </p>
                      <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight">
                        {item.title}
                      </h3>
                    </div>
                    <span className="font-mono text-[10px] tracking-[0.2em] text-xalisco-cream/70">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </div>
      </section>

      {/* ATMOSPHERE */}
      <section className="relative border-t border-xalisco-cream/10 bg-xalisco-black-soft/70 py-24 md:py-32">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 sm:px-8 md:grid-cols-2 md:gap-16 lg:px-12">
          <div data-atmo>
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-5xl">
              Mesa<br />
              <span className="italic text-xalisco-gold-bright">para volver</span>.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-xalisco-cream/75 md:text-lg">
              Fogón de toda la vida, arroces a fuego lento, brasa y buena conversación.
              Desde Almonte, con la mejor acogida.
            </p>
          </div>
          <div data-atmo className="flex flex-col gap-6">
            <div className="rounded-3xl border border-xalisco-cream/10 bg-xalisco-black/60 p-8">
              <p className="text-[11px] uppercase tracking-[0.28em] text-xalisco-gold-bright/90">
                Horario
              </p>
              <p className="mt-3 text-xl font-display">Comida y cena · todos los días</p>
              <p className="mt-2 text-sm text-xalisco-cream/60">
                Pregunta por encargos y reservas.
              </p>
            </div>
            <Magnetic>
              <Link
                href="/reservas"
                data-cursor="grow"
                data-cursor-label="Reservar"
                className="group inline-flex items-center gap-3 self-start rounded-full bg-xalisco-burnt-orange px-6 py-3.5 text-sm font-semibold text-xalisco-black transition-colors"
              >
                Reservar mesa
                <span className="transition-transform group-hover:translate-x-1" aria-hidden>
                  →
                </span>
              </Link>
            </Magnetic>
          </div>
        </div>
      </section>
    </div>
  );
}

"use client";

/**
 * Showcase de platos tipo revista / awwwards:
 *  - Desktop: scroll horizontal con pin (ScrollTrigger).
 *  - Mobile: lista vertical con cards grandes.
 * Cada slide tiene numeración 01/02/03, imagen grande, título y "ingredientes".
 */

import { useRef } from "react";
import { useGSAP, gsap } from "@/lib/gsap";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

type Dish = {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  image: string;
  tags: string[];
};

const DISHES: Dish[] = [
  {
    id: "arroz",
    number: "01",
    title: "Arroces a fuego lento",
    subtitle: "Tradición · Producto",
    image: "/local1.jpg",
    tags: ["Bomba", "Fumet", "Azafrán"],
  },
  {
    id: "brasa",
    number: "02",
    title: "Brasa con alma",
    subtitle: "Fuego · Tiempo",
    image: "/local2.jpg",
    tags: ["Encina", "Carnes", "Verduras"],
  },
  {
    id: "tapas",
    number: "03",
    title: "Tapas de compartir",
    subtitle: "Mesa · Sobremesa",
    image: "/local3.jpg",
    tags: ["Salmorejo", "Croquetas", "Bravas"],
  },
  {
    id: "postres",
    number: "04",
    title: "Postres caseros",
    subtitle: "Dulce · Final",
    image: "/bebida1.jpg",
    tags: ["Flan", "Tarta", "Café"],
  },
];

export function FoodGallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const track = trackRef.current;
      if (!section || !track) return;

      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px)", () => {
        const scrollDistance = () => track.scrollWidth - window.innerWidth;

        const tween = gsap.to(track, {
          x: () => -scrollDistance(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${scrollDistance()}`,
            scrub: 0.6,
            pin: true,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });

        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
        };
      });

      return () => mm.revert();
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-t border-xalisco-cream/10 bg-xalisco-black text-xalisco-cream"
    >
      {/* Header */}
      <div className="mx-auto max-w-[1400px] px-5 pt-24 sm:px-8 md:pt-32 lg:px-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-xalisco-gold-bright/85">
              <span className="mr-3 inline-block h-px w-8 align-middle bg-xalisco-gold-bright/70" />
              Carta destacada
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold leading-[0.95] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Una cocina<br />
              <span className="italic text-xalisco-gold-bright">con historia</span>.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-xalisco-cream/70 md:text-base">
            Platos pensados para compartir, cocinados con producto fresco y recetas de casa.
          </p>
        </div>
      </div>

      {/* Desktop: pinned horizontal track */}
      <div className="relative hidden lg:block">
        <div
          ref={trackRef}
          className="flex items-center gap-8 py-24 pl-[5vw] pr-[5vw] will-change-transform"
        >
          {DISHES.map((dish) => (
            <DishSlide key={dish.id} dish={dish} />
          ))}
          <div className="flex h-[60vh] w-[28vw] shrink-0 items-center justify-center rounded-3xl border border-xalisco-cream/15 bg-xalisco-black-soft/60 p-10 text-center">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-xalisco-gold-bright/85">
                ¿Sigues con hambre?
              </p>
              <h3 className="mt-3 font-display text-3xl font-semibold">Ver carta completa</h3>
              <a
                href="/menu"
                data-cursor="grow"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-xalisco-burnt-orange px-5 py-2.5 text-xs font-semibold text-xalisco-black"
              >
                Abrir menú →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: carrusel horizontal drag-scroll con snap */}
      <MobileDishCarousel />
    </section>
  );
}

function MobileDishCarousel() {
  const ref = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const scroller = scrollerRef.current;
      const indicator = indicatorRef.current;
      const count = countRef.current;
      if (!scroller) return;

      const update = () => {
        const max = scroller.scrollWidth - scroller.clientWidth;
        const p = max > 0 ? scroller.scrollLeft / max : 0;
        if (indicator) indicator.style.transform = `scaleX(${Math.min(1, Math.max(0, p))})`;
        if (count) {
          const idx = Math.round(p * (DISHES.length - 1)) + 1;
          count.textContent = `${String(idx).padStart(2, "0")} / ${String(DISHES.length).padStart(
            2,
            "0"
          )}`;
        }
      };
      update();
      scroller.addEventListener("scroll", update, { passive: true });

      // Reveal inicial de cada card al entrar en viewport
      const cards = scroller.querySelectorAll<HTMLElement>("[data-m-card]");
      cards.forEach((card, i) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            delay: i * 0.06,
            ease: "power3.out",
            scrollTrigger: { trigger: card, start: "top 90%" },
          }
        );
      });

      return () => {
        scroller.removeEventListener("scroll", update);
      };
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className="relative block border-t border-xalisco-cream/10 py-14 lg:hidden">
      {/* Indicador superior */}
      <div className="mx-5 mb-5 flex items-center gap-3 sm:mx-8">
        <div className="relative h-px flex-1 bg-xalisco-cream/15">
          <div
            ref={indicatorRef}
            className="absolute inset-y-0 left-0 origin-left scale-x-0 bg-xalisco-gold-bright"
            style={{ willChange: "transform" }}
          />
        </div>
        <span
          ref={countRef}
          className="font-mono text-[10px] uppercase tracking-[0.22em] text-xalisco-cream/60"
        >
          01 / {String(DISHES.length).padStart(2, "0")}
        </span>
      </div>

      {/* Scroll horizontal con snap */}
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden px-5 pb-2 [scrollbar-width:none] [-ms-overflow-style:none] sm:px-8 [&::-webkit-scrollbar]:hidden"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {DISHES.map((dish, i) => (
          <article
            key={dish.id}
            data-m-card
            data-cursor="grow"
            className="group relative flex w-[82vw] max-w-[380px] shrink-0 snap-center flex-col overflow-hidden rounded-3xl border border-xalisco-cream/10 bg-xalisco-black-soft/60"
          >
            <div className="relative aspect-[3/4] overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url(${dish.image})` }}
                role="img"
                aria-label={dish.title}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-xalisco-black/85 via-transparent to-transparent" />
              <div className="absolute left-5 top-5 font-mono text-[11px] tracking-[0.25em] text-xalisco-cream/80">
                {dish.number}
              </div>
              <div className="absolute right-5 top-5 rounded-full border border-xalisco-cream/25 bg-xalisco-black/50 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-xalisco-cream/80 backdrop-blur">
                {String(i + 1).padStart(2, "0")}/{String(DISHES.length).padStart(2, "0")}
              </div>
              <div className="absolute inset-x-5 bottom-5">
                <p className="text-[10px] uppercase tracking-[0.25em] text-xalisco-gold-bright/90">
                  {dish.subtitle}
                </p>
                <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight">
                  {dish.title}
                </h3>
              </div>
            </div>
            <ul className="flex flex-wrap gap-2 p-5 text-[10px] uppercase tracking-[0.2em] text-xalisco-cream/60">
              {dish.tags.map((t) => (
                <li key={t} className="rounded-full border border-xalisco-cream/15 px-3 py-1">
                  {t}
                </li>
              ))}
            </ul>
          </article>
        ))}
        {/* Slide final: CTA */}
        <article
          data-m-card
          className="flex w-[82vw] max-w-[380px] shrink-0 snap-center flex-col items-center justify-center rounded-3xl border border-xalisco-cream/10 bg-xalisco-black-soft/80 p-8 text-center"
        >
          <p className="text-[10px] uppercase tracking-[0.3em] text-xalisco-gold-bright/90">
            Sigue con hambre
          </p>
          <h3 className="mt-3 font-display text-3xl font-semibold">Abrir la carta</h3>
          <a
            href="/menu"
            data-cursor="grow"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-xalisco-burnt-orange px-5 py-3 text-xs font-semibold text-xalisco-black"
          >
            Ver menú →
          </a>
        </article>
      </div>

      {/* Hint "desliza" */}
      <div className="mx-5 mt-4 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.3em] text-xalisco-cream/50 sm:mx-8">
        <span>Desliza</span>
        <span className="inline-block">→</span>
      </div>
    </div>
  );
}

function DishSlide({ dish }: { dish: Dish }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const node = ref.current;
      if (!node) return;
      const img = node.querySelector<HTMLElement>("[data-dish-image]");
      if (!img) return;
      gsap.to(img, {
        xPercent: -8,
        ease: "none",
        scrollTrigger: {
          trigger: node,
          containerAnimation: undefined,
          start: "left right",
          end: "right left",
          scrub: true,
          horizontal: true,
        },
      });
    },
    { scope: ref }
  );

  return (
    <div
      ref={ref}
      className="group relative flex h-[72vh] w-[50vw] shrink-0 flex-col overflow-hidden rounded-3xl border border-xalisco-cream/10 bg-xalisco-black-soft/60"
      data-cursor="grow"
    >
      <div className="relative flex-1 overflow-hidden">
        <div data-dish-image className="absolute inset-0 h-full w-[115%] will-change-transform">
          <OptimizedImage
            src={dish.image}
            alt={dish.title}
            sizes="50vw"
            className="object-cover transition-transform duration-1000 group-hover:scale-105"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-xalisco-black/80 via-transparent to-transparent" />
        <div className="absolute left-6 top-6 font-mono text-sm tracking-widest text-xalisco-cream/80">
          {dish.number}
        </div>
      </div>
      <div className="flex flex-col gap-4 border-t border-xalisco-cream/10 bg-xalisco-black/70 p-8 backdrop-blur">
        <p className="text-[11px] uppercase tracking-[0.25em] text-xalisco-gold-bright/85">
          {dish.subtitle}
        </p>
        <h3 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          {dish.title}
        </h3>
        <ul className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.2em] text-xalisco-cream/60">
          {dish.tags.map((t) => (
            <li key={t} className="rounded-full border border-xalisco-cream/15 px-3 py-1">
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}


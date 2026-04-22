"use client";

/**
 * Storytelling rediseñado estilo editorial/awwwards:
 * - Una frase enorme con reveal palabra a palabra ligado al scroll.
 * - A la derecha, índice de secciones con indicadores animados.
 * - Debajo, marquee infinito con ingredientes / valores.
 */

import { useRef } from "react";
import { useGSAP, gsap } from "@/lib/gsap";
import { Marquee } from "@/components/fx/Marquee";
import { SplitText } from "@/components/fx/SplitText";
import { useSiteContent } from "@/components/providers/SiteContentProvider";
import type { StoryPillar, StoryStat } from "@/lib/site-content";

export function StorytellingSection() {
  const content = useSiteContent("home.story");
  const sectionRef = useRef<HTMLElement>(null);
  const quoteRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const quote = quoteRef.current;
      if (!quote) return;
      const words = quote.querySelectorAll<HTMLElement>("[data-quote-word]");
      gsap.fromTo(
        words,
        { opacity: 0.15 },
        {
          opacity: 1,
          duration: 0.3,
          stagger: 0.08,
          ease: "none",
          scrollTrigger: {
            trigger: quote,
            start: "top 75%",
            end: "bottom 40%",
            scrub: true,
          },
        }
      );
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-t border-xalisco-cream/10 bg-xalisco-black-soft py-24 text-xalisco-cream md:py-32"
    >
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
        <header className="mb-16 grid gap-6 md:mb-24 md:grid-cols-12 md:items-end">
          <p className="text-[10px] uppercase tracking-[0.35em] text-xalisco-gold-bright/85 md:col-span-3">
            <span className="mr-3 inline-block h-px w-8 align-middle bg-xalisco-gold-bright/70" />
            {content.eyebrow}
          </p>
          <SplitText
            as="h2"
            triggerOnScroll
            className="font-display text-4xl font-semibold leading-[0.95] tracking-tight sm:text-5xl md:col-span-9 md:text-6xl lg:text-7xl"
            text={content.title}
          />
        </header>

        <div
          ref={quoteRef}
          key={content.quote}
          className="font-display text-2xl font-medium leading-[1.2] text-xalisco-cream/90 sm:text-3xl md:max-w-5xl md:text-4xl lg:text-[3.2rem]"
        >
          {content.quote.split(" ").map((w, i) => (
            <span key={i} className="inline-block">
              <span data-quote-word className="inline-block">
                {w}
              </span>
              <span>&nbsp;</span>
            </span>
          ))}
        </div>

        <StatsRow stats={content.stats} />

        <div className="mt-16 grid gap-10 md:mt-20 md:grid-cols-2 lg:grid-cols-4">
          {content.pillars.map((pillar) => (
            <Pillar key={pillar.id} pillar={pillar} />
          ))}
        </div>
      </div>

      <div className="mt-24 border-y border-xalisco-cream/10 py-8 md:mt-32">
        <Marquee speed={60} className="text-xalisco-cream/80">
          {content.marquee_words.map((word) => (
            <span
              key={word}
              className="mx-8 font-display text-4xl font-medium tracking-tight sm:text-5xl md:text-6xl"
            >
              {word}{" "}
              <span className="text-xalisco-burnt-orange" aria-hidden>
                ✦
              </span>
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}

function StatsRow({ stats }: { stats: StoryStat[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const node = ref.current;
      if (!node) return;
      const items = node.querySelectorAll<HTMLElement>("[data-stat]");
      items.forEach((item) => {
        const target = Number(item.dataset.target || "0");
        const numEl = item.querySelector<HTMLElement>("[data-stat-num]");
        if (!numEl) return;
        const obj = { v: 0 };
        gsap.fromTo(
          item,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: { trigger: item, start: "top 85%" },
          }
        );
        gsap.to(obj, {
          v: target,
          duration: 1.6,
          ease: "power3.out",
          scrollTrigger: { trigger: item, start: "top 80%" },
          onUpdate: () => {
            numEl.textContent = Math.round(obj.v).toString();
          },
        });
      });
    },
    { scope: ref, dependencies: [stats] }
  );

  return (
    <div
      ref={ref}
      className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-xalisco-cream/10 bg-xalisco-cream/5 md:mt-24 md:grid-cols-4"
    >
      {stats.map((s, i) => (
        <div
          key={`${s.label}-${i}`}
          data-stat
          data-target={s.value}
          className="relative flex flex-col items-start gap-2 bg-xalisco-black-soft px-5 py-6 sm:px-6 sm:py-8"
        >
          <div className="flex items-baseline gap-0.5 font-display text-4xl font-semibold leading-none tracking-tight text-xalisco-gold-bright sm:text-5xl md:text-6xl">
            <span data-stat-num>0</span>
            <span className="text-xalisco-cream/70">{s.suffix}</span>
          </div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-xalisco-cream/60 sm:text-[11px]">
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function Pillar({ pillar }: { pillar: StoryPillar }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const node = ref.current;
      if (!node) return;
      const tween = gsap.fromTo(
        node,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: node, start: "top 85%" },
        }
      );
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    { scope: ref }
  );

  return (
    <div
      ref={ref}
      className="group relative border-t border-xalisco-cream/15 pt-6"
      data-cursor="grow"
    >
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-xalisco-cream/50">
        <span>{pillar.id}</span>
        <span
          className="inline-block h-px w-0 bg-xalisco-gold-bright transition-all duration-500 group-hover:w-8"
          aria-hidden
        />
      </div>
      <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight text-xalisco-cream md:text-3xl">
        {pillar.title}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-xalisco-cream/70">{pillar.copy}</p>
    </div>
  );
}

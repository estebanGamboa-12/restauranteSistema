"use client";

import Link from "next/link";
import { useRef } from "react";
import { useGSAP, gsap } from "@/lib/gsap";
import { Magnetic } from "@/components/fx/Magnetic";
import { useSiteContent } from "@/components/providers/SiteContentProvider";

export function HeroSection() {
  const content = useSiteContent("home.hero");
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const mediaMobileRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const bg = bgRef.current;
      const content = contentRef.current;
      if (!section || !bg || !content) return;

      const play = () => {
        const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
        tl.fromTo(
          "[data-hero-word]",
          { yPercent: 130 },
          { yPercent: 0, duration: 1.1, stagger: 0.08 }
        )
          .fromTo(
            "[data-hero-subline]",
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: 0.8 },
            "<0.3"
          )
          .fromTo(
            "[data-hero-tagline] span",
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: 0.6, stagger: 0.05 },
            "<0.1"
          )
          .fromTo(
            "[data-hero-cta]",
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.7, stagger: 0.1 },
            "<0.1"
          )
          .fromTo(
            "[data-hero-meta]",
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 },
            "<0.1"
          )
          .fromTo(
            "[data-hero-media]",
            {
              scale: 1.25,
              yPercent: 8,
              clipPath: "inset(12% 12% 12% 12%)",
            },
            {
              scale: 1,
              yPercent: 0,
              clipPath: "inset(0% 0% 0% 0%)",
              duration: 1.4,
              ease: "power3.out",
            },
            "<-0.6"
          )
          .fromTo(
            "[data-hero-media-mobile]",
            {
              y: 80,
              opacity: 0,
              clipPath: "inset(0% 0% 100% 0%)",
            },
            {
              y: 0,
              opacity: 1,
              clipPath: "inset(0% 0% 0% 0%)",
              duration: 1.2,
              ease: "power3.out",
            },
            "<"
          )
          .fromTo(
            "[data-hero-chip]",
            { scale: 0.6, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              duration: 0.7,
              stagger: 0.08,
              ease: "back.out(1.6)",
            },
            "<0.2"
          );
      };

      // Si hay IntroLoader, esperamos a su señal; si ya pasó, arrancamos.
      const introPlayed =
        typeof window !== "undefined" &&
        window.sessionStorage.getItem("pacos-intro-played");
      if (introPlayed) {
        play();
      } else {
        const handler = () => play();
        window.addEventListener("pacos:intro-done", handler, { once: true });
        const timer = window.setTimeout(() => {
          play();
          window.removeEventListener("pacos:intro-done", handler);
        }, 2000);
        return () => {
          window.removeEventListener("pacos:intro-done", handler);
          window.clearTimeout(timer);
        };
      }

      // Parallax scrub
      const bgTween = gsap.to(bg, {
        yPercent: 20,
        scale: 1.1,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
      const contentTween = gsap.to(content, {
        yPercent: -10,
        opacity: 0.2,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      // Mobile: ligero parallax sobre la imagen flotante de abajo
      if (mediaMobileRef.current) {
        gsap.to(mediaMobileRef.current, {
          yPercent: -15,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }

      return () => {
        bgTween.scrollTrigger?.kill();
        bgTween.kill();
        contentTween.scrollTrigger?.kill();
        contentTween.kill();
      };
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100svh] w-full overflow-hidden bg-xalisco-black text-xalisco-cream"
    >
      <div ref={bgRef} className="absolute inset-0 will-change-transform">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${content.image_main_url})` }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-br from-xalisco-black via-xalisco-black/65 to-xalisco-black-soft/95"
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-[0.1] mix-blend-overlay"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(247,236,211,0.12) 0 1px, transparent 1px 90px)",
          }}
          aria-hidden
        />
      </div>

      {/* Contenido */}
      <div
        ref={contentRef}
        className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1400px] flex-col items-start justify-between px-5 pt-24 pb-8 sm:px-8 sm:pt-28 sm:pb-12 lg:px-12 lg:pt-36 lg:pb-16"
      >
        <div className="flex w-full items-center justify-between text-[10px] uppercase tracking-[0.3em] text-xalisco-cream/55 sm:tracking-[0.35em]">
          <span data-hero-meta className="flex items-center gap-2">
            <span className="h-px w-6 bg-xalisco-gold-bright/70 sm:w-8" />
            Almonte · Huelva
          </span>
          <span data-hero-meta className="hidden sm:block">
            Abierto · Casera · Para llevar
          </span>
        </div>

        <div className="flex w-full flex-col gap-6 sm:gap-8">
          <p
            data-hero-tagline
            className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-xalisco-gold-bright/85 sm:gap-3 sm:text-[11px] sm:tracking-[0.32em]"
          >
            <span className="inline-block h-px w-8 bg-xalisco-gold-bright/70 sm:w-10" />
            {content.eyebrow_tagline.map((word, i) => (
              <span key={`${word}-${i}`} className="contents">
                <span>{word}</span>
                {i < content.eyebrow_tagline.length - 1 ? <span>·</span> : null}
              </span>
            ))}
          </p>

          <h1
            aria-label={`${content.title_line_1} ${content.title_line_2}`}
            className="font-display text-[18vw] leading-[0.88] font-semibold tracking-[-0.045em] sm:text-[13vw] lg:text-[11.5vw]"
          >
            <span className="block overflow-hidden">
              <span data-hero-word className="inline-block">
                {content.title_line_1}
              </span>
            </span>
            <span className="block overflow-hidden">
              <span
                data-hero-word
                className="inline-block italic text-xalisco-gold-bright"
              >
                {content.title_line_2}
              </span>
            </span>
          </h1>

          {/* Imagen flotante MOBILE: protagonista. Desktop la oculta y usa la lateral. */}
          <div
            ref={mediaMobileRef}
            data-hero-media-mobile
            className="relative mx-0 mt-2 flex items-end sm:hidden"
          >
            <div className="relative h-[200px] w-full overflow-hidden rounded-[18px] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)] will-change-transform">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${content.image_floating_url})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-xalisco-black/75 via-transparent to-transparent" />
              <div className="absolute inset-x-4 bottom-3 flex items-end justify-between">
                <div
                  data-hero-chip
                  className="flex items-center gap-2 rounded-full border border-xalisco-cream/20 bg-xalisco-black/60 px-3 py-1.5 backdrop-blur-md"
                >
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-xalisco-burnt-orange" />
                  <span className="text-[10px] uppercase tracking-[0.22em] text-xalisco-cream">
                    {content.open_today_label}
                  </span>
                </div>
                <div
                  data-hero-chip
                  className="rounded-full border border-xalisco-gold-bright/40 bg-xalisco-gold-bright/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-xalisco-gold-bright backdrop-blur-md"
                >
                  {content.rating_label}
                </div>
              </div>
            </div>
            <div
              data-hero-chip
              className="absolute -top-4 right-4 flex h-16 w-16 items-center justify-center rounded-full border border-xalisco-gold-bright/40 bg-xalisco-black/80 font-display text-[10px] uppercase tracking-[0.2em] text-xalisco-gold-bright backdrop-blur-md"
              style={{ transform: "rotate(-8deg)" }}
            >
              <span className="text-center leading-tight">
                {content.sticker_line_1}
                <br />
                {content.sticker_line_2}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
            <p
              data-hero-subline
              className="max-w-md text-[15px] leading-relaxed text-xalisco-cream/80 sm:text-lg"
            >
              {content.subtitle}
            </p>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
              <Magnetic>
                <Link
                  href={content.cta_primary_href}
                  data-hero-cta
                  data-cursor="grow"
                  data-cursor-label="Reservar"
                  className="group relative inline-flex w-full items-center justify-center gap-3 overflow-hidden rounded-full bg-xalisco-burnt-orange px-6 py-4 text-sm font-semibold text-xalisco-black transition-colors sm:w-auto sm:py-3.5"
                >
                  <span className="relative z-10">{content.cta_primary_label}</span>
                  <span className="relative z-10 transition-transform group-hover:translate-x-1" aria-hidden>
                    →
                  </span>
                  <span className="absolute inset-0 -translate-x-full bg-xalisco-gold-bright transition-transform duration-500 group-hover:translate-x-0" />
                </Link>
              </Magnetic>
              <Link
                href={content.cta_secondary_href}
                data-hero-cta
                data-cursor="grow"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full border border-xalisco-cream/30 bg-xalisco-black/30 px-6 py-4 text-sm font-semibold text-xalisco-cream backdrop-blur transition-colors hover:border-xalisco-gold-bright/60 hover:text-xalisco-gold-bright sm:w-auto sm:py-3.5"
              >
                {content.cta_secondary_label}
                <span className="transition-transform group-hover:translate-x-1" aria-hidden>
                  →
                </span>
              </Link>
            </div>
          </div>

          <div
            data-hero-meta
            className="mt-2 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-xalisco-cream/50 sm:mt-6"
          >
            <span className="inline-block h-px w-8 bg-xalisco-cream/40 sm:w-10" />
            <span>Scroll</span>
            <span className="inline-block h-4 w-[1px] origin-top animate-pulse bg-xalisco-cream/40" />
          </div>
        </div>
      </div>

      {/* Imagen flotante DESKTOP (lateral). En mobile la principal ya está arriba. */}
      <div
        ref={mediaRef}
        data-hero-media
        className="pointer-events-none absolute right-[5%] top-[18%] hidden h-[220px] w-[160px] overflow-hidden rounded-[16px] shadow-2xl sm:block md:h-[280px] md:w-[210px] lg:right-[7%] lg:top-[14%] lg:h-[320px] lg:w-[240px]"
        style={{ willChange: "transform, clip-path" }}
      >
        <div
          className="h-full w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${content.image_floating_url})` }}
        />
      </div>
    </section>
  );
}

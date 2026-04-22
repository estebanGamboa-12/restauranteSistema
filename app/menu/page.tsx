"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { MENU_CATEGORIES as FALLBACK_MENU_CATEGORIES, type MenuCategory } from "@/lib/menu-data";
import { MenuCategorySelector, type MenuTab } from "@/components/menu/MenuCategorySelector";
import { MenuGrid } from "@/components/menu/MenuGrid";
import { useGSAP, gsap } from "@/lib/gsap";
import { Marquee } from "@/components/fx/Marquee";
import { SITE_CONTACT } from "@/lib/site-contact";

export default function MenuPage() {
  const [categories, setCategories] = useState<MenuCategory[]>(FALLBACK_MENU_CATEGORIES);
  const defaultCategoryId = categories[0]?.id ?? "bocadillos";
  const menuTabs: MenuTab[] = useMemo(
    () =>
      categories.map((category) => ({
        id: category.id,
        label: category.title,
      })),
    [categories]
  );
  const [activeCategoryId, setActiveCategoryId] = useState(defaultCategoryId);
  const heroRef = useRef<HTMLElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadMenu() {
      try {
        const res = await fetch("/api/public/menu", { cache: "no-store" });
        const data = await res.json();
        if (res.ok && Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(data.categories);
        }
      } catch {
        setCategories(FALLBACK_MENU_CATEGORIES);
      }
    }
    void loadMenu();
  }, []);

  useEffect(() => {
    if (categories.length && !categories.some((category) => category.id === activeCategoryId)) {
      setActiveCategoryId(categories[0].id);
    }
  }, [activeCategoryId, categories]);

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(`menu-section-${id}`);
    if (!el) return;
    const isDesktop =
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 1024px)").matches;
    const offset = isDesktop ? 120 : 96;
    const y = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: y, left: 0, behavior: "smooth" });
  }, []);

  const handleSelectCategory = useCallback(
    (id: string) => {
      setActiveCategoryId(id);
      scrollToSection(id);
    },
    [scrollToSection]
  );

  useGSAP(
    () => {
      const hero = heroRef.current;
      if (!hero) return;
      const words = hero.querySelectorAll<HTMLElement>("[data-menu-word]");
      const meta = hero.querySelectorAll<HTMLElement>("[data-menu-meta]");

      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
      tl.fromTo(words, { yPercent: 120 }, { yPercent: 0, duration: 1, stagger: 0.1 })
        .fromTo(
          meta,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.06 },
          "<0.2"
        );

      // Parallax solo en pantallas grandes (en mobile lo dejamos estático para no freírlo).
      const isDesktop =
        typeof window !== "undefined" &&
        window.matchMedia("(min-width: 1024px)").matches;
      const bg = hero.querySelector<HTMLElement>("[data-menu-bg]");
      if (bg && isDesktop) {
        gsap.to(bg, {
          yPercent: 15,
          ease: "none",
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: "bottom top",
            scrub: 0.5,
          },
        });
      }
    },
    { scope: pageRef }
  );

  // Activo por scroll (rAF-throttled getBoundingClientRect). Mucho más ligero
  // que un IntersectionObserver con 9 thresholds x N secciones.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ids = categories.map((c) => c.id);
    if (!ids.length) return;

    let raf = 0;
    let lastActive = "";

    const recompute = () => {
      raf = 0;
      // "Línea de detección": justo debajo del sticky.
      const probe = window.innerHeight * 0.35;
      let best: string | null = null;
      let bestDist = Infinity;
      for (const id of ids) {
        const el = document.getElementById(`menu-section-${id}`);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        // Candidato: sección cuyo top esté por encima de la línea y cuyo bottom por debajo.
        if (r.top <= probe && r.bottom >= probe) {
          best = id;
          break;
        }
        // Si ninguna contiene la línea, tomamos la más cercana por encima.
        const dist = probe - r.top;
        if (dist >= 0 && dist < bestDist) {
          bestDist = dist;
          best = id;
        }
      }
      if (best && best !== lastActive) {
        lastActive = best;
        setActiveCategoryId(best);
      }
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(recompute);
    };

    recompute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [categories]);

  return (
    <div ref={pageRef} className="-mt-16 min-h-screen bg-xalisco-black text-xalisco-cream lg:-mt-20">
      {/* HERO editorial */}
      <header
        ref={heroRef}
        className="relative flex min-h-[70svh] items-end overflow-hidden border-b border-xalisco-cream/10 pt-32 pb-12 sm:min-h-[80svh] md:pt-44 md:pb-20"
      >
        <div
          data-menu-bg
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url(/local2.jpg)" }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-xalisco-black via-xalisco-black/40 to-xalisco-black"
          aria-hidden
        />
        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <p
            data-menu-meta
            className="text-[10px] uppercase tracking-[0.35em] text-xalisco-gold-bright/85"
          >
            <span className="mr-3 inline-block h-px w-8 align-middle bg-xalisco-gold-bright/70" />
            Carta · {new Date().getFullYear()}
          </p>
          <h1
            aria-label="La Carta"
            className="mt-6 font-display text-[18vw] leading-[0.88] font-semibold tracking-[-0.04em] sm:text-[14vw] lg:text-[11vw]"
          >
            <span className="block overflow-hidden">
              <span data-menu-word className="inline-block">La</span>
            </span>
            <span className="block overflow-hidden">
              <span data-menu-word className="inline-block italic text-xalisco-gold-bright">
                Carta.
              </span>
            </span>
          </h1>
          <div
            data-menu-meta
            className="mt-8 flex flex-col gap-6 text-sm text-xalisco-cream/75 md:flex-row md:items-end md:justify-between"
          >
            <p className="max-w-md leading-relaxed">
              Platos caseros, producto fresco y recetas que se hacen a diario. Encargos por teléfono
              y reservas para comer aquí.
            </p>
            <div className="flex items-center gap-4 text-[11px] uppercase tracking-[0.28em] text-xalisco-cream/55">
              <span>Encargos</span>
              <a
                href={SITE_CONTACT.telHref}
                data-cursor="grow"
                className="text-xalisco-gold-bright hover:underline"
              >
                +34 {SITE_CONTACT.phoneLocal}
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Marquee de categorías como banner */}
      <div className="border-y border-xalisco-cream/10 py-4">
        <Marquee speed={55} className="text-xalisco-cream/70">
          {menuTabs.map((t) => (
            <span
              key={t.id}
              className="mx-6 font-display text-2xl font-medium tracking-tight sm:text-3xl"
            >
              {t.label}
              <span className="ml-6 text-xalisco-burnt-orange" aria-hidden>
                ✦
              </span>
            </span>
          ))}
        </Marquee>
      </div>

      {/* Tabs sticky (estilo oscuro). Sin backdrop-blur para no comernos el frame rate. */}
      <div
        className="sticky top-16 z-30 border-b border-xalisco-cream/10 bg-xalisco-black/95 px-4 py-4 lg:top-20"
      >
        <div className="mx-auto max-w-[1400px] px-0 sm:px-4 lg:px-8">
          <MenuCategorySelector
            variant="carta"
            mode="sections"
            tabs={menuTabs}
            activeId={activeCategoryId}
            onSelect={handleSelectCategory}
          />
        </div>
      </div>

      {/* Badge flotante MOBILE: categoría activa + posición */}
      <MobileCategoryFab
        tabs={menuTabs}
        activeId={activeCategoryId}
      />


      {/* Secciones de la carta */}
      <section
        className="mx-auto max-w-[1100px] px-5 py-16 sm:px-8 lg:px-10 lg:py-24"
        aria-label="Categorías y platos"
      >
        <div className="flex flex-col gap-16 lg:gap-24">
          {categories.map((category) => (
            <MenuCategoryBlock key={category.id} category={category} />
          ))}
        </div>
      </section>
    </div>
  );
}

function MobileCategoryFab({
  tabs,
  activeId,
}: {
  tabs: MenuTab[];
  activeId: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const active = tabs.find((t) => t.id === activeId);
  const idx = Math.max(0, tabs.findIndex((t) => t.id === activeId));
  const total = tabs.length || 1;
  const progress = total > 0 ? (idx + 1) / total : 0;

  // Aparece/desaparece por scroll sin ScrollTrigger (evento nativo, mucho más ligero).
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let shown = false;
    const update = () => {
      const shouldShow = window.scrollY > 320;
      if (shouldShow === shown) return;
      shown = shouldShow;
      node.style.transform = shouldShow ? "translateY(0)" : "translateY(70px)";
      node.style.opacity = shouldShow ? "1" : "0";
      node.style.pointerEvents = shouldShow ? "auto" : "none";
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  // Actualizamos la barra sin crear un tween/ScrollTrigger, solo transform.
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    bar.style.transform = `scaleX(${progress})`;
  }, [progress]);

  return (
    <div
      ref={ref}
      className="fixed inset-x-4 bottom-5 z-30 lg:hidden"
      style={{
        transform: "translateY(70px)",
        opacity: 0,
        pointerEvents: "none",
        transition: "transform 0.35s cubic-bezier(.2,.8,.2,1), opacity 0.25s ease",
        willChange: "transform, opacity",
      }}
      aria-hidden
    >
      <div className="relative overflow-hidden rounded-full border border-xalisco-cream/15 bg-xalisco-black/95 pl-4 pr-5 py-2.5 shadow-[0_12px_36px_-12px_rgba(0,0,0,0.8)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-xalisco-gold-bright/15 font-mono text-[10px] font-semibold text-xalisco-gold-bright">
              {String(idx + 1).padStart(2, "0")}
            </span>
            <span className="truncate font-display text-sm font-semibold text-xalisco-cream">
              {active?.label ?? ""}
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-xalisco-cream/55">
            {String(idx + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-xalisco-cream/10">
          <div
            ref={barRef}
            className="h-full origin-left bg-gradient-to-r from-xalisco-burnt-orange to-xalisco-gold-bright"
            style={{
              transform: "scaleX(0)",
              transition: "transform 0.35s ease",
              willChange: "transform",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function MenuCategoryBlock({ category }: { category: MenuCategory }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const node = ref.current;
      if (!node) return;
      const title = node.querySelector<HTMLElement>("[data-cat-title]");
      const items = node.querySelectorAll<HTMLElement>("[data-cat-item]");

      // Un único ScrollTrigger por bloque: el título y el stagger de ítems van juntos.
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: { trigger: node, start: "top 82%", once: true },
      });
      if (title) {
        tl.fromTo(title, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 });
      }
      if (items.length) {
        tl.fromTo(
          items,
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, stagger: 0.03 },
          "<0.1"
        );
      }
    },
    { scope: ref }
  );

  return (
    <div ref={ref} id={`menu-section-${category.id}`} className="relative">
      <div
        data-cat-title
        className="mb-10 flex items-baseline justify-between gap-6 border-b border-xalisco-cream/10 pb-4"
      >
        <h2 className="font-display text-3xl font-semibold tracking-tight text-xalisco-cream md:text-5xl">
          {category.title}
        </h2>
        <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-xalisco-cream/50">
          {String(category.dishes.length).padStart(2, "0")} · platos
        </span>
      </div>
      <div className="hidden">
        {/* MenuGrid sigue existiendo para backcompat si se linkea panel-xxx */}
        <MenuGrid
          categoryId={category.id}
          dishes={category.dishes}
          panelId={`panel-${category.id}`}
          categoryTitle={category.title}
        />
      </div>
      <ul className="grid gap-6 md:grid-cols-2">
        {category.dishes.map((d) => (
          <li
            key={d.id}
            data-cat-item
            data-cursor="grow"
            className="group relative flex gap-5 border-b border-xalisco-cream/5 pb-6"
          >
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-xalisco-cream/15 bg-xalisco-black-soft md:h-28 md:w-28">
              <div
                className="absolute inset-0 bg-cover bg-center md:transition-transform md:duration-500 md:group-hover:scale-110"
                style={{ backgroundImage: `url(${d.image})` }}
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-display text-lg font-semibold tracking-tight text-xalisco-cream md:text-xl">
                  {d.name}
                </h3>
                <span className="font-display text-lg text-xalisco-gold-bright md:text-xl">
                  {d.price}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-xalisco-cream/65">{d.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

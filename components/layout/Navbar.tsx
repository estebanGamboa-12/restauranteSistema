"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useSiteAuth } from "@/components/providers/SiteAuthProvider";
import { Magnetic } from "@/components/fx/Magnetic";
import { gsap } from "gsap";

const NAV_LINKS = [
  { href: "/", label: "Inicio", kicker: "01" },
  { href: "/menu", label: "Carta", kicker: "02" },
  { href: "/rooftop", label: "El local", kicker: "03" },
  { href: "/reservas", label: "Reservas", kicker: "04" },
  { href: "/contacto", label: "Contacto", kicker: "05" },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, isStaff, loading, signOut } = useSiteAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const accountLink = user
    ? { href: "/account", label: "Mi cuenta" }
    : { href: "/login", label: "Entrar" };
  const panelLink = isStaff ? { href: "/dashboard", label: "Panel" } : null;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) setMenuOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    const root = menuRef.current;
    if (!root) return;
    if (menuOpen) {
      document.body.style.overflow = "hidden";
      const tl = gsap.timeline({ defaults: { ease: "power4.inOut" } });
      tl.set(root, { pointerEvents: "auto" })
        .to(root, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.85 })
        .fromTo(
          "[data-menu-item]",
          { yPercent: 110 },
          { yPercent: 0, duration: 0.9, stagger: 0.07, ease: "power4.out" },
          "<0.2"
        )
        .fromTo(
          "[data-menu-meta]",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 },
          "<0.1"
        );
      return () => {
        tl.kill();
      };
    } else {
      document.body.style.overflow = "";
      const tl = gsap.timeline({ defaults: { ease: "power4.inOut" } });
      tl.to("[data-menu-item]", { yPercent: -110, duration: 0.5, stagger: 0.04 })
        .to(root, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.55 }, "<0.1")
        .set(root, { pointerEvents: "none" });
      return () => {
        tl.kill();
      };
    }
  }, [menuOpen]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[80] transition-all duration-500",
          scrolled || menuOpen
            ? "border-b border-xalisco-cream/10 bg-xalisco-black/85 backdrop-blur-xl"
            : "bg-transparent"
        )}
      >
        <nav className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-10">
          <Link
            href="/"
            className="font-display text-lg font-semibold tracking-tight text-xalisco-cream transition-colors hover:text-xalisco-gold-bright lg:text-xl"
            data-cursor="grow"
            aria-label="Paco's Food"
          >
            <span className="relative inline-flex items-baseline gap-1">
              <span
                className="inline-block h-2 w-2 rounded-full bg-xalisco-burnt-orange"
                aria-hidden
              />
              Paco&apos;s<span className="text-xalisco-gold-bright italic">Food</span>
            </span>
          </Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <li key={href}>
                  <Link
                    href={href}
                    data-cursor="grow"
                    className={cn(
                      "group relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
                      active ? "text-xalisco-gold-bright" : "text-xalisco-cream/80 hover:text-xalisco-cream"
                    )}
                  >
                    <span className="relative z-10">{label}</span>
                    <span
                      className={cn(
                        "absolute left-3 right-3 bottom-1 h-px origin-left scale-x-0 bg-xalisco-gold-bright transition-transform duration-500",
                        active ? "scale-x-100" : "group-hover:scale-x-100"
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="hidden items-center gap-2 lg:flex">
            {!loading && (
              <>
                <Link
                  href={accountLink.href}
                  className="rounded-full border border-xalisco-cream/25 px-3 py-1.5 text-xs font-semibold text-xalisco-cream transition-colors hover:border-xalisco-gold-bright/70 hover:text-xalisco-gold-bright"
                  data-cursor="grow"
                >
                  {accountLink.label}
                </Link>
                {panelLink && (
                  <Link
                    href={panelLink.href}
                    className="rounded-full border border-xalisco-gold-bright/40 px-3 py-1.5 text-xs font-semibold text-xalisco-gold-bright transition-colors hover:border-xalisco-gold-bright"
                    data-cursor="grow"
                  >
                    {panelLink.label}
                  </Link>
                )}
                {user && (
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="rounded-full border border-xalisco-cream/25 px-3 py-1.5 text-xs font-semibold text-xalisco-cream transition-colors hover:border-xalisco-cream/60"
                    data-cursor="grow"
                  >
                    Salir
                  </button>
                )}
              </>
            )}
            <Magnetic strength={0.25}>
              <Link
                href="/reservas"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-xalisco-burnt-orange px-5 py-2.5 text-sm font-semibold text-xalisco-black transition-colors"
                data-cursor="grow"
                data-cursor-label="Reservar"
              >
                <span className="relative z-10">Reservar</span>
                <span className="relative z-10 transition-transform group-hover:translate-x-1" aria-hidden>
                  →
                </span>
                <span className="absolute inset-0 -translate-x-full bg-xalisco-gold-bright transition-transform duration-500 group-hover:translate-x-0" />
              </Link>
            </Magnetic>
          </div>

          {/* Mobile: burger */}
          <button
            type="button"
            className="lg:hidden relative z-[110] flex h-11 w-11 items-center justify-center rounded-full border border-xalisco-cream/30 text-xalisco-cream"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
          >
            <span className="sr-only">Menú</span>
            <div className="relative h-3.5 w-5">
              <span
                className={cn(
                  "absolute left-0 right-0 top-0 h-px bg-current transition-transform duration-500",
                  menuOpen && "translate-y-[7px] rotate-45"
                )}
              />
              <span
                className={cn(
                  "absolute left-0 right-0 bottom-0 h-px bg-current transition-transform duration-500",
                  menuOpen && "-translate-y-[6px] -rotate-45"
                )}
              />
            </div>
          </button>
        </nav>
      </header>

      {/* Menú fullscreen mobile */}
      <div
        ref={menuRef}
        className="fixed inset-0 z-[100] bg-xalisco-black text-xalisco-cream lg:hidden"
        style={{ clipPath: "inset(0% 0% 100% 0%)", pointerEvents: "none" }}
      >
        <div className="flex h-full flex-col justify-between px-6 pt-24 pb-12">
          <ul className="flex flex-col gap-2">
            {NAV_LINKS.map(({ href, label, kicker }) => {
              const active = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <li key={href} className="overflow-hidden">
                  <Link
                    href={href}
                    data-menu-item
                    className={cn(
                      "group flex items-baseline gap-4 border-b border-xalisco-cream/10 py-4 font-display text-4xl font-semibold tracking-tight transition-colors sm:text-5xl",
                      active ? "text-xalisco-gold-bright" : "text-xalisco-cream hover:text-xalisco-gold-bright"
                    )}
                  >
                    <span className="text-xs font-mono uppercase tracking-[0.2em] text-xalisco-cream/40">
                      {kicker}
                    </span>
                    <span className="flex-1">{label}</span>
                    <span
                      className="inline-block opacity-0 -translate-x-3 transition-all group-hover:opacity-100 group-hover:translate-x-0"
                      aria-hidden
                    >
                      →
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-col gap-6">
            <div className="grid gap-2 text-sm">
              {!loading && (
                <>
                  <Link
                    data-menu-meta
                    href={accountLink.href}
                    className="rounded-full border border-xalisco-cream/20 px-4 py-2.5 text-center font-semibold"
                  >
                    {accountLink.label}
                  </Link>
                  {panelLink && (
                    <Link
                      data-menu-meta
                      href={panelLink.href}
                      className="rounded-full border border-xalisco-gold-bright/40 px-4 py-2.5 text-center font-semibold text-xalisco-gold-bright"
                    >
                      {panelLink.label}
                    </Link>
                  )}
                  {user && (
                    <button
                      data-menu-meta
                      type="button"
                      onClick={() => void signOut()}
                      className="rounded-full border border-xalisco-cream/20 px-4 py-2.5 text-center font-semibold text-xalisco-cream"
                    >
                      Salir
                    </button>
                  )}
                </>
              )}
              <Link
                data-menu-meta
                href="/reservas"
                className="rounded-full bg-xalisco-burnt-orange px-4 py-3 text-center font-semibold text-xalisco-black"
              >
                Reservar mesa →
              </Link>
            </div>
            <p
              data-menu-meta
              className="text-[11px] uppercase tracking-[0.28em] text-xalisco-cream/40"
            >
              Almonte · Huelva
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

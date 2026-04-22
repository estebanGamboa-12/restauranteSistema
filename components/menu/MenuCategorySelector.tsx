"use client";

/**
 * MenuCategorySelector
 *
 * Reescrito ligero: sin framer-motion, sin layoutId animados (causaban lag
 * severo al cambiar de categoría durante el scroll). El estado activo se
 * muestra con una clase CSS. En mobile, los tabs son un scroll horizontal
 * con snap para no apilarse en muchas filas; el tab activo se auto-scrollea
 * al centro.
 */

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface MenuTab {
  id: string;
  label: string;
}

interface MenuCategorySelectorProps {
  tabs: MenuTab[];
  activeId: string;
  onSelect: (id: string) => void;
  variant?: "default" | "carta";
  mode?: "tabs" | "sections";
}

export function MenuCategorySelector({
  tabs,
  activeId,
  onSelect,
  variant = "default",
  mode = "tabs",
}: MenuCategorySelectorProps) {
  const isCarta = variant === "carta";
  const isSections = mode === "sections";
  const listRef = useRef<HTMLDivElement>(null);

  // Cuando cambia el tab activo, lo centramos en la tira horizontal.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const activeEl = list.querySelector<HTMLButtonElement>(
      `[data-tab-id="${activeId}"]`
    );
    if (!activeEl) return;
    const listRect = list.getBoundingClientRect();
    const elRect = activeEl.getBoundingClientRect();
    const target =
      activeEl.offsetLeft - list.clientWidth / 2 + activeEl.clientWidth / 2;
    // Solo scrolleamos la barra, nunca la página.
    if (Math.abs(elRect.left - listRect.left - activeEl.offsetLeft) < 1) {
      list.scrollTo({ left: target, behavior: "smooth" });
    } else {
      list.scrollTo({ left: target, behavior: "smooth" });
    }
  }, [activeId]);

  return (
    <div
      ref={listRef}
      className="relative flex w-full snap-x snap-mandatory gap-2 overflow-x-auto overflow-y-hidden px-1 py-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:justify-center sm:gap-3 sm:overflow-visible sm:px-0 sm:py-0 [&::-webkit-scrollbar]:hidden"
      role={isSections ? "navigation" : "tablist"}
      aria-label={isSections ? "Secciones de la carta" : "Categorías del menú"}
    >
      {tabs.map((tab) => {
        const isActive = activeId === tab.id;
        return (
          <button
            key={tab.id}
            data-tab-id={tab.id}
            type="button"
            role={isSections ? undefined : "tab"}
            aria-selected={isSections ? undefined : isActive}
            aria-controls={isSections ? undefined : `panel-${tab.id}`}
            id={isSections ? undefined : `tab-${tab.id}`}
            aria-current={isSections && isActive ? "location" : undefined}
            onClick={() => onSelect(tab.id)}
            className={cn(
              "shrink-0 snap-center whitespace-nowrap rounded-full border px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.15em] transition-colors duration-150 sm:px-5 sm:py-2.5 sm:text-xs sm:tracking-[0.2em]",
              isCarta
                ? isActive
                  ? "border-xalisco-burnt-orange bg-xalisco-burnt-orange text-xalisco-black"
                  : "border-xalisco-cream/15 bg-xalisco-cream/5 text-xalisco-cream/75 hover:border-xalisco-cream/35 hover:text-xalisco-cream"
                : isActive
                ? "border-transparent bg-xalisco-gold-bright text-xalisco-black"
                : "border-xalisco-cream/15 bg-xalisco-cream/5 text-xalisco-cream/75 hover:border-xalisco-cream/35 hover:text-xalisco-cream"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

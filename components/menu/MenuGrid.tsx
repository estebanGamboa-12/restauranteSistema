"use client";

import type { Dish } from "@/lib/menu-data";
import { DishCard } from "./DishCard";

interface MenuGridProps {
  dishes: Dish[];
  panelId: string;
  categoryTitle: string;
  /** Mismo id que en MENU_CATEGORIES (p. ej. bocadillos) — ancla #menu-section-{id} */
  categoryId: string;
}

export function MenuGrid({
  dishes,
  panelId,
  categoryTitle,
  categoryId,
}: MenuGridProps) {
  const sectionDomId = `menu-section-${categoryId}`;

  return (
    <div
      role="region"
      aria-labelledby={`heading-${categoryId}`}
      id={sectionDomId}
      className="scroll-mt-24 md:scroll-mt-28"
    >
      <h2 id={`heading-${categoryId}`} className="sr-only">
        {categoryTitle}
      </h2>
      <div
        id={panelId}
        className="relative rounded-[1.75rem] border border-[color:var(--xalisco-border)] bg-xalisco-black-soft px-5 py-8 pt-11 text-xalisco-cream shadow-[0_16px_40px_rgba(15,23,42,0.18)] sm:rounded-[2rem] sm:px-8 sm:py-10 sm:pt-14"
      >
        <div
          className="absolute -top-3 left-5 z-10 inline-block rounded-md border border-xalisco-burnt-orange/30 bg-xalisco-black px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-xalisco-gold shadow-sm ring-1 ring-xalisco-burnt-orange/45 sm:left-8 sm:text-sm"
          aria-hidden
        >
          {categoryTitle}
        </div>
        <div className="flex flex-col">
          {dishes.map((dish, index) => (
            <DishCard
              key={dish.id}
              dish={dish}
              isLast={index === dishes.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

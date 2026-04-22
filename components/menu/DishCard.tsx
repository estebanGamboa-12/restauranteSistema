"use client";

import type { Dish } from "@/lib/menu-data";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

interface DishCardProps {
  dish: Dish;
  isLast?: boolean;
}

/** Fila estilo carta: marrón, tipografía crema/dorada, foto circular. */
export function DishCard({ dish, isLast }: DishCardProps) {
  return (
    <article
      className={[
        "flex flex-col gap-4 border-[color:var(--xalisco-border)] py-5 sm:flex-row sm:items-center sm:gap-6",
        isLast ? "border-b-0 pb-0" : "border-b",
      ].join(" ")}
    >
      <div className="order-2 min-w-0 flex-1 sm:order-1">
        <h3 className="font-sans text-base font-bold uppercase leading-snug tracking-wide text-xalisco-gold sm:text-[0.95rem]">
          {dish.name}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-xalisco-cream/82">
          {dish.description}
        </p>
        <p className="mt-2 text-lg font-bold text-xalisco-burnt-orange">{dish.price}</p>
      </div>
      <div className="relative order-1 mx-auto h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-xalisco-gold bg-xalisco-black shadow-[0_10px_24px_rgba(15,23,42,0.22)] sm:order-2 sm:mx-0 sm:h-32 sm:w-32">
        <OptimizedImage
          src={dish.image}
          alt={dish.name}
          sizes="(max-width: 640px) 112px, 128px"
          className="object-cover"
        />
      </div>
    </article>
  );
}

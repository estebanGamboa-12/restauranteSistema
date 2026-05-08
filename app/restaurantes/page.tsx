import Link from "next/link";
import { listRestaurants, resolveRestaurantContext } from "@/lib/restaurant-context";

export const dynamic = "force-dynamic";

export default async function RestaurantsPage() {
  const [restaurants, activeRestaurant] = await Promise.all([
    listRestaurants(),
    resolveRestaurantContext(),
  ]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-xalisco-black px-4 py-24 text-xalisco-cream sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(245,200,122,0.16),_transparent_32%),radial-gradient(circle_at_80%_20%,_rgba(232,108,62,0.16),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.02),_transparent_45%)]" />

      <section className="relative mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.32em] text-xalisco-gold-bright/80">
            Multi-restaurant demo
          </p>
          <h1 className="mt-5 font-display text-5xl font-semibold tracking-[-0.05em] text-xalisco-cream sm:text-6xl lg:text-7xl">
            Cambia de restaurante
            <span className="block italic text-xalisco-gold-bright">
              y prueba cada tenant.
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-xalisco-cream/70 sm:text-lg">
            Cada restaurante mantiene sus reservas, clientes, personal y panel
            completamente separados. El selector fija el tenant activo y toda la
            app se recarga con sus propios datos.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {restaurants.map((restaurant, index) => {
            const isActive = restaurant.slug === activeRestaurant?.slug;
            return (
              <article
                key={restaurant.id}
                className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(245,200,122,0.08),transparent_35%,rgba(232,108,62,0.12))] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full border border-xalisco-gold-bright/25 bg-xalisco-gold-bright/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-xalisco-gold-bright">
                      Demo {String(index + 1).padStart(2, "0")}
                    </span>
                    {isActive ? (
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-400/12 px-3 py-1 text-[11px] font-medium text-emerald-300">
                        Activo
                      </span>
                    ) : null}
                  </div>

                  <h2 className="mt-6 font-display text-3xl font-semibold tracking-[-0.04em] text-xalisco-cream">
                    {restaurant.name}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-xalisco-cream/65">
                    {[restaurant.address, restaurant.city, restaurant.country]
                      .filter(Boolean)
                      .join(", ") || "Sin ubicación cargada"}
                  </p>

                  <div className="mt-8 flex flex-wrap gap-2 text-xs text-xalisco-cream/60">
                    {restaurant.phone ? (
                      <span className="rounded-full border border-white/10 px-3 py-1.5">
                        {restaurant.phone}
                      </span>
                    ) : null}
                    {restaurant.email ? (
                      <span className="rounded-full border border-white/10 px-3 py-1.5">
                        {restaurant.email}
                      </span>
                    ) : null}
                    <span className="rounded-full border border-white/10 px-3 py-1.5">
                      /{restaurant.slug}
                    </span>
                  </div>

                  <div className="mt-8 flex gap-3">
                    <Link
                      href={`/r/${restaurant.slug}?redirect=/`}
                      className="inline-flex flex-1 items-center justify-center rounded-full bg-xalisco-burnt-orange px-4 py-3 text-sm font-semibold text-xalisco-black transition-colors hover:bg-xalisco-burnt-orange-hover"
                    >
                      Abrir web
                    </Link>
                    <Link
                      href={`/r/${restaurant.slug}?redirect=/dashboard`}
                      className="inline-flex flex-1 items-center justify-center rounded-full border border-white/15 px-4 py-3 text-sm font-semibold text-xalisco-cream transition-colors hover:border-xalisco-gold-bright/60 hover:text-xalisco-gold-bright"
                    >
                      Abrir panel
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

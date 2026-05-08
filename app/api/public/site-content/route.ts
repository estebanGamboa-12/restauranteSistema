import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  SITE_CONTENT_DEFAULTS,
  SITE_SECTION_KEYS,
  mergeSiteContent,
  type SiteSectionKey,
} from "@/lib/site-content";
import { resolveRestaurantContext } from "@/lib/restaurant-context";

export const dynamic = "force-dynamic";

export async function GET() {
  const restaurant = await resolveRestaurantContext();
  if (!restaurant?.id) {
    // Sin restaurante configurado: devolvemos defaults para que la web no rompa.
    return NextResponse.json({ content: SITE_CONTENT_DEFAULTS });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("site_content")
      .select("section_key, content")
      .eq("restaurant_id", restaurant.id);

    if (error) {
      // Si la tabla aún no existe (migración no corrida), devolvemos defaults.
      return NextResponse.json({ content: SITE_CONTENT_DEFAULTS });
    }

    const overrides: Record<string, Record<string, unknown>> = {};
    for (const row of data ?? []) {
      const key = row.section_key as string;
      if ((SITE_SECTION_KEYS as string[]).includes(key)) {
        overrides[key as SiteSectionKey] = (row.content ?? {}) as Record<
          string,
          unknown
        >;
      }
    }

    const merged = mergeSiteContent(overrides);
    return NextResponse.json(
      { content: merged },
      {
        headers: {
          // Cache corto para que los cambios se vean rápido pero sin martillear BBDD.
          "Cache-Control": "public, max-age=10, stale-while-revalidate=60",
        },
      }
    );
  } catch {
    return NextResponse.json({ content: SITE_CONTENT_DEFAULTS });
  }
}

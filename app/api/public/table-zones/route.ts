"use server";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { resolveRestaurantContext } from "@/lib/restaurant-context";

export async function GET(req: NextRequest) {
  const restaurant = await resolveRestaurantContext(req);
  if (!restaurant?.id) {
    return NextResponse.json(
      { error: "Restaurant id not configured" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("tables")
    .select("id, name, capacity")
    .eq("restaurant_id", restaurant.id)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error loading table zones", error);
    return NextResponse.json(
      { error: "Error al cargar las zonas de mesas" },
      { status: 500 }
    );
  }

  const debug =
    process.env.NODE_ENV === "development"
      ? {
          restaurantId: restaurant.id,
          zonesFound: Array.isArray(data) ? data.length : 0,
        }
      : undefined;

  if (!data || data.length === 0) {
    return NextResponse.json(
      {
        error:
          "No hay zonas para este restaurante. Revisa que las zonas estén en la tabla 'tables' con el restaurant_id correcto.",
        zones: [],
        debug: debug ?? null,
      },
      { status: 404 }
    );
  }

  // Devolver todas las zonas (cada fila en tables es una zona: Salón, Terraza, etc.)
  const zones = (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    capacity: (row.capacity as number) ?? null,
  }));

  return NextResponse.json({ zones, debug: debug ?? null });
}


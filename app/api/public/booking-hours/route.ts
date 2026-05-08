"use server";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { resolveRestaurantContext } from "@/lib/restaurant-context";

export async function GET() {
  const restaurant = await resolveRestaurantContext();
  if (!restaurant?.id) {
    return NextResponse.json(
      { error: "Restaurant id not configured" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("restaurants")
    .select(
      "timezone, comida_start, comida_end, cena_start, cena_end, slot_interval_minutes"
    )
    .eq("id", restaurant.id)
    .maybeSingle();

  if (error) {
    console.error("Error loading booking hours", error);
    return NextResponse.json(
      { error: "Error al cargar horarios" },
      { status: 500 }
    );
  }

  const toHHmm = (t: unknown): string => {
    const s = (t ?? "") as string;
    if (!s) return "";
    const part = s.trim().slice(0, 5);
    return part.length === 5 ? part : s;
  };
  const r = data;
  const timezone = (r?.timezone as string) ?? "Europe/Madrid";
  const comidaStart = toHHmm(r?.comida_start) || "13:00";
  const comidaEnd = toHHmm(r?.comida_end) || "16:00";
  const cenaStart = toHHmm(r?.cena_start) || "20:00";
  const cenaEnd = toHHmm(r?.cena_end) || "23:00";
  const slotInterval = Number(r?.slot_interval_minutes) || 15;

  return NextResponse.json({
    timezone,
    comida: { start: comidaStart, end: comidaEnd },
    cena: { start: cenaStart, end: cenaEnd },
    slot_interval_minutes: slotInterval,
  });
}

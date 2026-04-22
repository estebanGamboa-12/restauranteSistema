"use server";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requirePermission } from "@/lib/api-rbac";

export async function GET(req: NextRequest) {
  const staff = await requirePermission(req, "reservations");
  if (staff instanceof NextResponse) return staff;
  const restaurantId = staff.restaurantId;

  const { data, error } = await supabaseAdmin
    .from("restaurants")
    .select(
      "timezone, comida_start, comida_end, cena_start, cena_end, slot_interval_minutes"
    )
    .eq("id", restaurantId)
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
    return s.trim().slice(0, 5).length === 5 ? s.trim().slice(0, 5) : s;
  };
  const r = data;
  return NextResponse.json({
    timezone: (r?.timezone as string) ?? "Europe/Madrid",
    comida: {
      start: toHHmm(r?.comida_start) || "13:00",
      end: toHHmm(r?.comida_end) || "16:00",
    },
    cena: {
      start: toHHmm(r?.cena_start) || "20:00",
      end: toHHmm(r?.cena_end) || "23:00",
    },
    slot_interval_minutes: Number(r?.slot_interval_minutes) || 15,
  });
}

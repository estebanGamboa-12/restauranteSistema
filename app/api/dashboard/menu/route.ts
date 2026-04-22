"use server";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requirePermission } from "@/lib/api-rbac";

export async function GET(req: NextRequest) {
  const staff = await requirePermission(req, "menu");
  if (staff instanceof NextResponse) return staff;

  const { data, error } = await supabaseAdmin
    .from("menu_items")
    .select(
      "id, section, name, description, price_cents, image_url, available, sort_order, created_at, updated_at"
    )
    .eq("restaurant_id", staff.restaurantId)
    .order("section", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "No se pudo cargar la carta." },
      { status: 500 }
    );
  }

  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: NextRequest) {
  const staff = await requirePermission(req, "menu");
  if (staff instanceof NextResponse) return staff;

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const section = String(body.section ?? "").trim();
  const name = String(body.name ?? "").trim();
  const description = body.description ? String(body.description).trim() : null;
  const price_cents = Number.isFinite(Number(body.price_cents))
    ? Math.max(0, Math.floor(Number(body.price_cents)))
    : 0;
  const image_url = body.image_url ? String(body.image_url).trim() : null;
  const available = body.available === undefined ? true : Boolean(body.available);
  const sort_order = Number.isFinite(Number(body.sort_order))
    ? Math.floor(Number(body.sort_order))
    : 0;

  if (!section || !name) {
    return NextResponse.json(
      { error: "Sección y nombre son obligatorios." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("menu_items")
    .insert({
      restaurant_id: staff.restaurantId,
      section,
      name,
      description,
      price_cents,
      image_url,
      available,
      sort_order,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "No se pudo crear el artículo." },
      { status: 500 }
    );
  }

  return NextResponse.json({ item: data });
}

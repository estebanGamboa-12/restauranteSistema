"use server";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requirePermission } from "@/lib/api-rbac";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const staff = await requirePermission(req, "menu");
  if (staff instanceof NextResponse) return staff;

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  if (typeof body.section === "string") payload.section = body.section.trim();
  if (typeof body.name === "string") payload.name = body.name.trim();
  if (body.description === null || typeof body.description === "string")
    payload.description = body.description
      ? String(body.description).trim()
      : null;
  if (body.price_cents !== undefined)
    payload.price_cents = Number.isFinite(Number(body.price_cents))
      ? Math.max(0, Math.floor(Number(body.price_cents)))
      : 0;
  if (body.image_url === null || typeof body.image_url === "string")
    payload.image_url = body.image_url ? String(body.image_url).trim() : null;
  if (body.available !== undefined) payload.available = Boolean(body.available);
  if (body.sort_order !== undefined)
    payload.sort_order = Number.isFinite(Number(body.sort_order))
      ? Math.floor(Number(body.sort_order))
      : 0;

  const { data, error } = await supabaseAdmin
    .from("menu_items")
    .update(payload)
    .eq("id", params.id)
    .eq("restaurant_id", staff.restaurantId)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "No se pudo actualizar el artículo." },
      { status: 500 }
    );
  }
  if (!data) {
    return NextResponse.json(
      { error: "Artículo no encontrado." },
      { status: 404 }
    );
  }

  return NextResponse.json({ item: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const staff = await requirePermission(_req, "menu");
  if (staff instanceof NextResponse) return staff;

  const { error } = await supabaseAdmin
    .from("menu_items")
    .delete()
    .eq("id", params.id)
    .eq("restaurant_id", staff.restaurantId);

  if (error) {
    return NextResponse.json(
      { error: "No se pudo eliminar el artículo." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

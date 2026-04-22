"use server";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requirePermission } from "@/lib/api-rbac";
import { DEFAULT_MESSAGE_TEMPLATES } from "@/lib/message-templates";

export async function GET(req: NextRequest) {
  const staff = await requirePermission(req, "settings");
  if (staff instanceof NextResponse) return staff;

  const { data, error } = await supabaseAdmin
    .from("message_templates")
    .select("key, title, body, updated_at")
    .eq("restaurant_id", staff.restaurantId);

  if (error) {
    return NextResponse.json(
      { error: "No se pudieron cargar las plantillas." },
      { status: 500 }
    );
  }

  const templates =
    data && data.length > 0 ? data : DEFAULT_MESSAGE_TEMPLATES;

  return NextResponse.json({ templates });
}

export async function PUT(req: NextRequest) {
  const staff = await requirePermission(req, "settings");
  if (staff instanceof NextResponse) return staff;

  let body: { templates?: { key: string; title: string; body: string }[] } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const list = Array.isArray(body.templates) ? body.templates : [];
  if (list.length === 0) {
    return NextResponse.json({ ok: true });
  }

  const rows = list
    .filter(
      (t) =>
        typeof t?.key === "string" &&
        typeof t?.title === "string" &&
        typeof t?.body === "string"
    )
    .map((t) => ({
      restaurant_id: staff.restaurantId,
      key: t.key,
      title: t.title,
      body: t.body,
      updated_at: new Date().toISOString(),
    }));

  const { error } = await supabaseAdmin
    .from("message_templates")
    .upsert(rows, { onConflict: "restaurant_id,key" });

  if (error) {
    return NextResponse.json(
      { error: "No se pudieron guardar las plantillas." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

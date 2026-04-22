"use server";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requirePermission } from "@/lib/api-rbac";
import {
  SITE_CONTENT_DEFAULTS,
  SITE_SECTION_KEYS,
  mergeSiteContent,
  type SiteSectionKey,
} from "@/lib/site-content";

export async function GET(req: NextRequest) {
  const staff = await requirePermission(req, "content");
  if (staff instanceof NextResponse) return staff;

  const { data, error } = await supabaseAdmin
    .from("site_content")
    .select("section_key, content, updated_at")
    .eq("restaurant_id", staff.restaurantId);

  if (error) {
    return NextResponse.json(
      { error: "No se pudo cargar el contenido." },
      { status: 500 }
    );
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

  const content = mergeSiteContent(overrides);
  return NextResponse.json({
    content,
    defaults: SITE_CONTENT_DEFAULTS,
    updated_at: (data ?? []).map((r) => ({
      section_key: r.section_key,
      updated_at: r.updated_at,
    })),
  });
}

export async function PUT(req: NextRequest) {
  const staff = await requirePermission(req, "content");
  if (staff instanceof NextResponse) return staff;

  let body: {
    section_key?: string;
    content?: Record<string, unknown>;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const sectionKey = body.section_key;
  const content = body.content;
  if (
    typeof sectionKey !== "string" ||
    !(SITE_SECTION_KEYS as string[]).includes(sectionKey) ||
    !content ||
    typeof content !== "object"
  ) {
    return NextResponse.json(
      { error: "section_key o content inválido" },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("site_content")
    .upsert(
      {
        restaurant_id: staff.restaurantId,
        section_key: sectionKey,
        content,
        updated_by: staff.userId ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "restaurant_id,section_key" }
    );

  if (error) {
    return NextResponse.json(
      { error: "No se pudo guardar el contenido." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const staff = await requirePermission(req, "content");
  if (staff instanceof NextResponse) return staff;

  const url = new URL(req.url);
  const sectionKey = url.searchParams.get("section_key");
  if (!sectionKey || !(SITE_SECTION_KEYS as string[]).includes(sectionKey)) {
    return NextResponse.json(
      { error: "section_key inválido" },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("site_content")
    .delete()
    .eq("restaurant_id", staff.restaurantId)
    .eq("section_key", sectionKey);

  if (error) {
    return NextResponse.json(
      { error: "No se pudo restablecer la sección." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

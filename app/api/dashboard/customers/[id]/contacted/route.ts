"use server";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requirePermission } from "@/lib/api-rbac";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const staff = await requirePermission(req, "customers");
  if (staff instanceof NextResponse) return staff;

  const { error } = await supabaseAdmin
    .from("customers")
    .update({ last_contacted_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("restaurant_id", staff.restaurantId);

  if (error) {
    return NextResponse.json(
      { error: "No se pudo actualizar." },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}

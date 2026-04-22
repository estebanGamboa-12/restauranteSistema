"use server";

import { NextRequest, NextResponse } from "next/server";
import { getStaffFromRequest } from "@/lib/auth-dashboard";
import { getRolePermissionsFromDb } from "@/lib/permissions-db";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const staff = await getStaffFromRequest(req);
  if (!staff) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const permissions = await getRolePermissionsFromDb(staff.restaurantId, staff.role);
  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select("name")
    .eq("id", staff.restaurantId)
    .maybeSingle();

  return NextResponse.json({
    role: staff.role,
    restaurantId: staff.restaurantId,
    restaurantName: restaurant?.name ?? null,
    name: staff.name ?? null,
    email: staff.email ?? null,
    permissions,
  });
}

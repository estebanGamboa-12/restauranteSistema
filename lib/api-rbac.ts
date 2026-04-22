"use server";

import { NextRequest, NextResponse } from "next/server";
import { getStaffFromRequest } from "@/lib/auth-dashboard";
import type { StaffContext } from "@/lib/auth-dashboard";
import { getRolePermissionsFromDb } from "@/lib/permissions-db";
import type { DashboardPermission } from "@/lib/rbac";

/**
 * Ensures the request has a valid staff context and the given permission.
 * Permissions are read from DB (restaurant_role_permissions); admin always has all.
 */
export async function requirePermission(
  req: NextRequest,
  permission: DashboardPermission
): Promise<StaffContext | NextResponse> {
  const staff = await getStaffFromRequest(req);
  if (!staff) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (staff.role === "admin") return staff;
  const allowed = await getRolePermissionsFromDb(staff.restaurantId, staff.role);
  if (!allowed.includes(permission)) {
    return NextResponse.json(
      { error: "No tienes permiso para realizar esta acción" },
      { status: 403 }
    );
  }
  return staff;
}

"use server";

import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-rbac";
import { deleteRole, getRolePermissionsRows, updateRolePermissions } from "@/lib/permissions-db";

export async function GET(req: NextRequest) {
  const staff = await requirePermission(req, "staff");
  if (staff instanceof NextResponse) return staff;
  const restaurantId = staff.restaurantId;

  const rows = await getRolePermissionsRows(restaurantId);
  return NextResponse.json({ permissions: rows });
}

export async function PUT(req: NextRequest) {
  const staff = await requirePermission(req, "staff");
  if (staff instanceof NextResponse) return staff;
  const restaurantId = staff.restaurantId;

  const body = await req.json();
  const role = typeof body.role === "string" ? body.role.trim() : "";
  if (!role) {
    return NextResponse.json(
      { error: "Rol inválido" },
      { status: 400 }
    );
  }

  const perms = {
    can_dashboard: !!body.can_dashboard,
    can_reservations: !!body.can_reservations,
    can_reservations_delete: !!body.can_reservations_delete,
    can_menu: !!body.can_menu,
    can_tables: !!body.can_tables,
    can_tables_edit: !!body.can_tables_edit,
    can_customers: !!body.can_customers,
    can_calendar: !!body.can_calendar,
    can_settings: !!body.can_settings,
    can_staff: !!body.can_staff,
    can_payments: !!body.can_payments,
    can_table_checkin: !!body.can_table_checkin,
  };

  const result = await updateRolePermissions(restaurantId, role, perms);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ message: "Permisos guardados" });
}

export async function DELETE(req: NextRequest) {
  const staff = await requirePermission(req, "staff");
  if (staff instanceof NextResponse) return staff;
  const restaurantId = staff.restaurantId;

  const { searchParams } = new URL(req.url);
  const role = (searchParams.get("role") ?? "").trim();
  if (!role) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  }

  const result = await deleteRole(restaurantId, role);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ message: "Rol eliminado" });
}

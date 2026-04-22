"use server";

import { supabaseAdmin } from "@/lib/supabase";
import type { DashboardPermission } from "@/lib/rbac";
import { ROLE_PERMISSIONS } from "@/lib/rbac";

const PERMISSION_COLUMNS: Record<DashboardPermission, string> = {
  dashboard: "can_dashboard",
  reservations: "can_reservations",
  reservations_delete: "can_reservations_delete",
  menu: "can_menu",
  tables: "can_tables",
  tables_edit: "can_tables_edit",
  customers: "can_customers",
  calendar: "can_calendar",
  settings: "can_settings",
  staff: "can_staff",
  payments: "can_payments",
  table_checkin: "can_table_checkin",
  content: "can_content",
};

const ALL_PERMISSIONS: DashboardPermission[] = [
  "dashboard",
  "reservations",
  "reservations_delete",
  "menu",
  "tables",
  "tables_edit",
  "customers",
  "calendar",
  "settings",
  "staff",
  "payments",
  "table_checkin",
  "content",
];

/** Admin siempre tiene todos los permisos. Si la tabla no existe, usa ROLE_PERMISSIONS. */
export async function getRolePermissionsFromDb(
  restaurantId: string,
  role: string
): Promise<DashboardPermission[]> {
  if (role === "admin") return ALL_PERMISSIONS;

  try {
    const { data, error } = await supabaseAdmin
      .from("restaurant_role_permissions")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("role", role)
      .maybeSingle();

    if (error || !data) {
      return (ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] ?? []) as DashboardPermission[];
    }

    const list: DashboardPermission[] = [];
    for (const perm of ALL_PERMISSIONS) {
      const col = PERMISSION_COLUMNS[perm];
      if (data[col as keyof typeof data]) list.push(perm);
    }
    return list;
  } catch {
    return (ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] ?? []) as DashboardPermission[];
  }
}

export type RolePermissionsRow = {
  role: string;
  can_dashboard: boolean;
  can_reservations: boolean;
  can_reservations_delete: boolean;
  can_menu: boolean;
  can_tables: boolean;
  can_tables_edit: boolean;
  can_customers: boolean;
  can_calendar: boolean;
  can_settings: boolean;
  can_staff: boolean;
  can_payments: boolean;
  can_table_checkin: boolean;
};

export async function getRolePermissionsRows(
  restaurantId: string
): Promise<RolePermissionsRow[]> {
  const { data, error } = await supabaseAdmin
    .from("restaurant_role_permissions")
    .select("role, can_dashboard, can_reservations, can_reservations_delete, can_menu, can_tables, can_tables_edit, can_customers, can_calendar, can_settings, can_staff, can_payments, can_table_checkin")
    .eq("restaurant_id", restaurantId)
    .neq("role", "admin")
    .order("role", { ascending: true });

  if (error) return [];
  return (data ?? []) as RolePermissionsRow[];
}

export async function updateRolePermissions(
  restaurantId: string,
  role: string,
  permissions: Partial<Record<keyof Omit<RolePermissionsRow, "role">, boolean>>
): Promise<{ error?: string }> {
  const normalizedRole = (role ?? "").trim();
  if (!normalizedRole) return { error: "Rol inválido" };
  if (normalizedRole === "admin") {
    return { error: "El rol admin siempre tiene todo y no se edita aquí" };
  }

  const { error } = await supabaseAdmin
    .from("restaurant_role_permissions")
    .upsert(
      {
        restaurant_id: restaurantId,
        role: normalizedRole,
        ...permissions,
      },
      { onConflict: "restaurant_id,role" }
    );

  if (error) return { error: error.message };
  return {};
}

export async function deleteRole(
  restaurantId: string,
  role: string
): Promise<{ error?: string }> {
  const normalizedRole = (role ?? "").trim();
  if (!normalizedRole) return { error: "Rol inválido" };
  if (normalizedRole === "admin") {
    return { error: "El rol admin no se puede borrar" };
  }

  // 1) Reasignar empleados con ese rol a 'staff' (para no dejar a nadie “sin rol”)
  const { error: updateError } = await supabaseAdmin
    .from("restaurant_staff")
    .update({ role: "staff" })
    .eq("restaurant_id", restaurantId)
    .eq("role", normalizedRole);
  if (updateError) return { error: updateError.message };

  // 2) Eliminar permisos del rol
  const { error: deleteError } = await supabaseAdmin
    .from("restaurant_role_permissions")
    .delete()
    .eq("restaurant_id", restaurantId)
    .eq("role", normalizedRole);

  if (deleteError) return { error: deleteError.message };
  return {};
}

/**
 * Role-based access control for the admin dashboard.
 * Roles: admin | manager | staff (stored in restaurant_staff.role).
 */

// Allow custom roles from DB while keeping known ones typed.
export type DashboardRole =
  | "admin"
  | "manager"
  | "staff"
  | (string & {});

export type DashboardPermission =
  | "dashboard"
  | "reservations"
  | "reservations_delete"
  | "menu"
  | "tables"
  | "tables_edit"
  | "customers"
  | "calendar"
  | "settings"
  | "staff"
  | "payments"
  | "table_checkin"
  | "content";

/** Which permissions each role has (fallback when DB not yet migrated) */
export const ROLE_PERMISSIONS: Record<DashboardRole, DashboardPermission[]> = {
  admin: [
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
  ],
  manager: [
    "dashboard",
    "reservations",
    "reservations_delete",
    "menu",
    "tables",
    "tables_edit",
    "customers",
    "calendar",
    "table_checkin",
    "content",
  ],
  staff: [
    "dashboard",
    "reservations",
    "calendar",
    "table_checkin",
  ],
};

export function can(role: DashboardRole, permission: DashboardPermission): boolean {
  return (ROLE_PERMISSIONS[role] ?? []).includes(permission);
}

/** Routes that require a specific permission; staff sees no Settings/Staff/Payments/Tables management */
export const ROUTE_PERMISSION: Record<string, DashboardPermission> = {
  "/dashboard": "dashboard",
  "/dashboard/reservations": "reservations",
  "/dashboard/calendar": "calendar",
  "/dashboard/menu": "menu",
  "/dashboard/tables": "tables",
  "/dashboard/customers": "customers",
  "/dashboard/settings": "settings",
  "/dashboard/templates": "settings",
  "/dashboard/staff": "staff",
  "/dashboard/payments": "payments",
  "/dashboard/content": "content",
};

/** Sidebar links and the permission needed to see each */
export const SIDEBAR_LINKS: { href: string; label: string; permission: DashboardPermission }[] = [
  { href: "/dashboard", label: "Panel", permission: "dashboard" },
  { href: "/dashboard/reservations", label: "Reservas", permission: "reservations" },
  { href: "/dashboard/calendar", label: "Calendario", permission: "calendar" },
  { href: "/dashboard/menu", label: "Carta", permission: "menu" },
  { href: "/dashboard/tables", label: "Zonas", permission: "tables" },
  { href: "/dashboard/customers", label: "Clientes", permission: "customers" },
  { href: "/dashboard/payments", label: "Pagos", permission: "payments" },
  { href: "/dashboard/content", label: "Contenido web", permission: "content" },
  { href: "/dashboard/templates", label: "Plantillas", permission: "settings" },
  { href: "/dashboard/settings", label: "Ajustes", permission: "settings" },
  { href: "/dashboard/staff", label: "Staff", permission: "staff" },
];

export function canAccessRoute(role: DashboardRole, pathname: string): boolean {
  const permission = ROUTE_PERMISSION[pathname];
  if (!permission) return true;
  return can(role, permission);
}

export function getVisibleSidebarLinks(role: DashboardRole) {
  return SIDEBAR_LINKS.filter((link) => can(role, link.permission));
}

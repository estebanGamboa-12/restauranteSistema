"use client";

import {
  LayoutDashboard,
  CalendarDays,
  Users,
  UtensilsCrossed,
  MapPinned,
  Receipt,
  MessageSquareText,
  Settings,
  UserCog,
  ClipboardList,
  LayoutTemplate,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/dashboard/reservations": ClipboardList,
  "/dashboard/calendar": CalendarDays,
  "/dashboard/menu": UtensilsCrossed,
  "/dashboard/tables": MapPinned,
  "/dashboard/customers": Users,
  "/dashboard/payments": Receipt,
  "/dashboard/content": LayoutTemplate,
  "/dashboard/templates": MessageSquareText,
  "/dashboard/settings": Settings,
  "/dashboard/staff": UserCog,
};

export function NavIcon({
  href,
  className,
}: {
  href: string;
  className?: string;
}) {
  const Icon = MAP[href] ?? LayoutDashboard;
  return <Icon className={className} aria-hidden />;
}

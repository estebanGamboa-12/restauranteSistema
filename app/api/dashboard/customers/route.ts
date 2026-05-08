"use server";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requirePermission } from "@/lib/api-rbac";
import { DEFAULT_MESSAGE_TEMPLATES } from "@/lib/message-templates";

const REENGAGEMENT_DAYS = 90;

export async function GET(req: NextRequest) {
  const staff = await requirePermission(req, "customers");
  if (staff instanceof NextResponse) return staff;
  const restaurantId = staff.restaurantId;

  const [customersRes, reservationsRes, templatesRes] = await Promise.all([
    supabaseAdmin
      .from("customers")
      .select(
        "id, name, email, phone, notes, marketing_opt_in, marketing_channel_email, marketing_channel_whatsapp, last_contacted_at"
      )
      .eq("restaurant_id", restaurantId)
      .order("name", { ascending: true }),
    supabaseAdmin
      .from("reservations")
      .select(
        "id, customer_id, customer_name, customer_email, customer_phone, guests, reservation_date, reservation_time, status, notes, meal_type, table:tables!reservations_table_id_fkey(name)"
      )
      .eq("restaurant_id", restaurantId)
      .order("reservation_date", { ascending: false }),
    supabaseAdmin
      .from("message_templates")
      .select("key, title, body, updated_at")
      .eq("restaurant_id", restaurantId),
  ]);

  if (customersRes.error || reservationsRes.error) {
    console.error(customersRes.error ?? reservationsRes.error);
    return NextResponse.json(
      { error: "Error cargando clientes." },
      { status: 500 }
    );
  }

  const reservations = (reservationsRes.data ?? []).map((r) => {
    const t = r.table as unknown as { name?: string } | null;
    return {
      id: r.id,
      customer_id: r.customer_id,
      customer_name: r.customer_name,
      customer_email: r.customer_email,
      customer_phone: r.customer_phone,
      guests: r.guests,
      reservation_date: r.reservation_date,
      reservation_time: r.reservation_time,
      status: r.status,
      notes: r.notes,
      meal_type: r.meal_type,
      zone_name: t?.name ?? null,
    };
  });

  const now = Date.now();
  const customers = (customersRes.data ?? []).map((c) => {
    const related = reservations.filter((r) => {
      if (r.customer_id && r.customer_id === c.id) return true;
      if (!r.customer_id) {
        const nameMatch = (r.customer_name ?? "") === c.name;
        const emailMatch = c.email
          ? (r.customer_email ?? "").toLowerCase() === c.email.toLowerCase()
          : true;
        const phoneMatch = c.phone
          ? (r.customer_phone ?? "") === c.phone
          : true;
        return nameMatch && emailMatch && phoneMatch;
      }
      return false;
    });

    const validStatuses = new Set([
      "pending",
      "confirmed",
      "completed",
      "completada",
      "confirmada",
      "reservada",
    ]);
    const past = related.filter((r) => {
      const t = new Date(`${r.reservation_date}T${r.reservation_time}`).getTime();
      return t <= now && validStatuses.has(r.status ?? "");
    });

    const lastVisit =
      past.length > 0
        ? past
            .map((r) => `${r.reservation_date}T${r.reservation_time}`)
            .sort()
            .at(-1) ?? null
        : null;
    const lastVisitDate = lastVisit ? lastVisit.slice(0, 10) : null;

    const inactiveDays = lastVisit
      ? Math.floor((now - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const needsReengagement =
      !!c.marketing_opt_in &&
      past.length > 0 &&
      (inactiveDays ?? 0) >= REENGAGEMENT_DAYS;

    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      notes: c.notes,
      marketing_opt_in: !!c.marketing_opt_in,
      marketing_channel_email: !!c.marketing_channel_email,
      marketing_channel_whatsapp: !!c.marketing_channel_whatsapp,
      last_contacted_at: c.last_contacted_at,
      total_reservations: related.length,
      last_visit: lastVisitDate,
      inactive_days: inactiveDays,
      needs_reengagement: needsReengagement,
    };
  });

  const templates =
    templatesRes.data && templatesRes.data.length > 0
      ? templatesRes.data
      : DEFAULT_MESSAGE_TEMPLATES;

  return NextResponse.json({ customers, reservations, templates });
}

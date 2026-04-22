"use server";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requirePermission } from "@/lib/api-rbac";

export async function GET(req: NextRequest) {
  const staff = await requirePermission(req, "settings");
  if (staff instanceof NextResponse) return staff;
  const restaurantId = staff.restaurantId;

  const [{ data: restaurant, error }, { data: settings }] = await Promise.all([
    supabaseAdmin
      .from("restaurants")
      .select(
        "name, email, phone, address, opening_time, closing_time, max_guests_per_reservation, timezone, comida_start, comida_end, cena_start, cena_end, slot_interval_minutes"
      )
      .eq("id", restaurantId)
      .maybeSingle(),
    supabaseAdmin
      .from("restaurant_settings")
      .select("email_reminders_enabled, reminder_hours_before, reengagement_after_days")
      .eq("restaurant_id", restaurantId)
      .maybeSingle(),
  ]);

  if (error) {
    console.error("Error loading restaurant settings", error);
    return NextResponse.json(
      { error: "Error al cargar la configuración" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    restaurant: restaurant ?? null,
    settings: settings ?? {
      email_reminders_enabled: true,
      reminder_hours_before: 24,
      reengagement_after_days: 30,
    },
  });
}

export async function PUT(req: NextRequest) {
  const staff = await requirePermission(req, "settings");
  if (staff instanceof NextResponse) return staff;
  const restaurantId = staff.restaurantId;

  const body = await req.json();
  const {
    name,
    email,
    phone,
    address,
    opening_time,
    closing_time,
    max_guests_per_reservation,
    timezone,
    comida_start,
    comida_end,
    cena_start,
    cena_end,
    slot_interval_minutes,
    email_reminders_enabled,
    reminder_hours_before,
    reengagement_after_days,
  } = body;

  const sanitizedName = typeof name === "string" ? name.trim() : "";
  if (!sanitizedName) {
    return NextResponse.json(
      { error: "El nombre del restaurante es obligatorio" },
      { status: 400 }
    );
  }

  const slug =
    sanitizedName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "") || "restaurant";

  const { error } = await supabaseAdmin.from("restaurants").upsert(
    {
      id: restaurantId,
      name: sanitizedName,
      slug,
      email: typeof email === "string" && email.trim() ? email.trim() : null,
      phone: typeof phone === "string" && phone.trim() ? phone.trim() : null,
      address:
        typeof address === "string" && address.trim() ? address.trim() : null,
      opening_time:
        typeof opening_time === "string" && opening_time.trim()
          ? opening_time.trim()
          : null,
      closing_time:
        typeof closing_time === "string" && closing_time.trim()
          ? closing_time.trim()
          : null,
      max_guests_per_reservation:
        typeof max_guests_per_reservation === "number" &&
        Number.isFinite(max_guests_per_reservation)
          ? max_guests_per_reservation
          : null,
      timezone:
        typeof timezone === "string" && timezone.trim() ? timezone.trim() : null,
      comida_start:
        typeof comida_start === "string" && comida_start.trim()
          ? comida_start.trim()
          : null,
      comida_end:
        typeof comida_end === "string" && comida_end.trim()
          ? comida_end.trim()
          : null,
      cena_start:
        typeof cena_start === "string" && cena_start.trim()
          ? cena_start.trim()
          : null,
      cena_end:
        typeof cena_end === "string" && cena_end.trim()
          ? cena_end.trim()
          : null,
      slot_interval_minutes:
        typeof slot_interval_minutes === "number" &&
        Number.isInteger(slot_interval_minutes) &&
        slot_interval_minutes > 0
          ? slot_interval_minutes
          : null,
    },
    { onConflict: "id" }
  );

  if (error) {
    console.error("Error saving restaurant settings", error);
    return NextResponse.json(
      { error: "No se pudo guardar la configuración" },
      { status: 500 }
    );
  }

  const { error: settingsError } = await supabaseAdmin
    .from("restaurant_settings")
    .upsert(
      {
        restaurant_id: restaurantId,
        email_reminders_enabled: email_reminders_enabled !== false,
        reminder_hours_before:
          typeof reminder_hours_before === "number" &&
          Number.isFinite(reminder_hours_before)
            ? Math.max(1, Math.round(reminder_hours_before))
            : 24,
        reengagement_after_days:
          typeof reengagement_after_days === "number" &&
          Number.isFinite(reengagement_after_days)
            ? Math.max(1, Math.round(reengagement_after_days))
            : 30,
      },
      { onConflict: "restaurant_id" }
    );

  if (settingsError) {
    console.error("Error saving reminder settings", settingsError);
    return NextResponse.json(
      { error: "No se pudo guardar la configuración de avisos" },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "Configuración guardada correctamente" });
}

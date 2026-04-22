/**
 * Lógica por zonas: capacidad y ocupación.
 * Cada "zona" es un registro en `tables` (ej. Salón, Terraza).
 * Varias reservas pueden compartir la misma zona en la misma franja si
 * la suma de comensales no supera la capacidad de la zona.
 */

import { supabaseAdmin } from "@/lib/supabase";

export type ZoneCapacityResult = { used: number; capacity: number };

/**
 * Devuelve la ocupación actual (suma de guests) en una zona para una fecha y hora,
 * y la capacidad máxima de esa zona.
 * @param zoneId table_id (id de la zona en `tables`)
 * @param date reservation_date (YYYY-MM-DD)
 * @param time reservation_time (HH:MM o HH:MM:SS)
 * @param excludeReservationId si se indica, se excluye esta reserva del sumatorio (para ediciones)
 */
export async function getZoneCapacityUsed(
  zoneId: string,
  date: string,
  time: string,
  excludeReservationId?: string
): Promise<ZoneCapacityResult> {
  const { data: zone, error: zoneError } = await supabaseAdmin
    .from("tables")
    .select("capacity")
    .eq("id", zoneId)
    .single();

  if (zoneError || !zone) {
    return { used: 0, capacity: 0 };
  }

  let query = supabaseAdmin
    .from("reservations")
    .select("guests")
    .eq("table_id", zoneId)
    .eq("reservation_date", date)
    .eq("reservation_time", time)
    .in("status", ["pending", "confirmed"]);

  if (excludeReservationId) {
    query = query.neq("id", excludeReservationId);
  }

  const { data: rows, error } = await query;

  if (error) {
    return { used: 0, capacity: (zone.capacity as number) ?? 0 };
  }

  const used = (rows ?? []).reduce((sum, r) => sum + (Number(r.guests) || 0), 0);
  const capacity = (zone.capacity as number) ?? 0;

  return { used, capacity };
}

/**
 * Comprueba si se puede añadir `newGuests` a la zona en la franja indicada
 * sin superar la capacidad (evitar overbooking).
 */
export async function canFitInZone(
  zoneId: string,
  date: string,
  time: string,
  newGuests: number,
  excludeReservationId?: string
): Promise<{ ok: boolean; used: number; capacity: number }> {
  const timeNorm = (time || "").trim().slice(0, 5);
  const { used, capacity } = await getZoneCapacityUsed(
    zoneId,
    date,
    timeNorm || time,
    excludeReservationId
  );
  const ok = capacity > 0 && used + newGuests <= capacity;
  return { ok, used, capacity };
}

/**
 * Comprueba si el mismo cliente (email o teléfono) ya tiene alguna reserva
 * ese mismo día (pending/confirmed). Una persona = una reserva por día.
 * No se usa el nombre (puede haber varios "Javier").
 */
export async function hasDuplicateReservation(
  restaurantId: string,
  date: string,
  _time: string,
  email: string | null,
  phone: string | null,
  excludeReservationId?: string,
  mealType?: "comida" | "cena" | null
): Promise<boolean> {
  let query = supabaseAdmin
    .from("reservations")
    .select("id, customer_email, customer_phone")
    .eq("restaurant_id", restaurantId)
    .eq("reservation_date", date)
    .in("status", ["pending", "confirmed"]);

  if (mealType) {
    query = query.eq("meal_type", mealType);
  }

  if (excludeReservationId) {
    query = query.neq("id", excludeReservationId);
  }

  const { data: rows, error } = await query;

  if (error || !rows || rows.length === 0) return false;

  const emailNorm = (email || "").trim().toLowerCase();
  const phoneNorm = (phone || "").replace(/\s/g, "");

  return rows.some((r) => {
    const rEmail = ((r.customer_email as string) || "").trim().toLowerCase();
    const rPhone = ((r.customer_phone as string) || "").replace(/\s/g, "");
    if (emailNorm && rEmail && rEmail === emailNorm) return true;
    if (phoneNorm && rPhone && rPhone === phoneNorm) return true;
    return false;
  });
}

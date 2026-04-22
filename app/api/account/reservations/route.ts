import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID;

export async function GET() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (!RESTAURANT_ID) {
    return NextResponse.json({ error: "Restaurante no configurado" }, { status: 500 });
  }

  const { data: customer } = await supabaseAdmin
    .from("customers")
    .select("id")
    .eq("restaurant_id", RESTAURANT_ID)
    .eq("user_id", user.id)
    .maybeSingle();

  const customerId = customer?.id ?? null;
  const userEmail = user.email?.toLowerCase() ?? null;

  let query = supabaseAdmin
    .from("reservations")
    .select(
      "id, reservation_date, reservation_time, guests, status, meal_type, notes, deposit_paid, table:tables(name)"
    )
    .eq("restaurant_id", RESTAURANT_ID)
    .order("reservation_date", { ascending: false })
    .order("reservation_time", { ascending: false })
    .limit(100);

  if (customerId) {
    query = query.or(
      `customer_id.eq.${customerId}` +
        (userEmail ? `,customer_email.ilike.${userEmail}` : "")
    );
  } else if (userEmail) {
    query = query.ilike("customer_email", userEmail);
  } else {
    return NextResponse.json({ reservations: [] });
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { error: "No se pudieron cargar las reservas." },
      { status: 500 }
    );
  }

  const reservations = (data ?? []).map((r) => {
    const table = (r.table as unknown as { name?: string } | null) ?? null;
    return {
      id: r.id,
      reservation_date: r.reservation_date,
      reservation_time: r.reservation_time,
      guests: r.guests,
      status: r.status,
      meal_type: r.meal_type ?? null,
      notes: r.notes ?? null,
      deposit_paid: !!r.deposit_paid,
      zone_name: table?.name ?? null,
    };
  });

  return NextResponse.json({ reservations });
}

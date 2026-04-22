import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";
import { canFitInZone, hasDuplicateReservation } from "@/lib/zone-capacity";

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

async function loadOwnedReservation(id: string, userId: string) {
  if (!RESTAURANT_ID) return { error: "Restaurante no configurado", code: 500 };

  const { data: reservation } = await supabaseAdmin
    .from("reservations")
    .select("*, restaurant:restaurants(name, refund_window_hours, stripe_account_id)")
    .eq("id", id)
    .eq("restaurant_id", RESTAURANT_ID)
    .maybeSingle();
  if (!reservation) return { error: "Reserva no encontrada", code: 404 };

  let owned = false;
  if (reservation.customer_id) {
    const { data: customer } = await supabaseAdmin
      .from("customers")
      .select("user_id, email")
      .eq("id", reservation.customer_id)
      .maybeSingle();
    if (customer?.user_id === userId) owned = true;
  }

  if (!owned) {
    const { data: user } = await supabaseAdmin.auth.admin.getUserById(userId);
    const email = user.user?.email?.toLowerCase() ?? null;
    if (
      email &&
      (reservation.customer_email ?? "").trim().toLowerCase() === email
    ) {
      owned = true;
    }
  }

  if (!owned) return { error: "No tienes acceso a esta reserva", code: 403 };

  return { reservation };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const loaded = await loadOwnedReservation(params.id, user.id);
  if (loaded.error)
    return NextResponse.json({ error: loaded.error }, { status: loaded.code });

  const reservation = loaded.reservation!;

  if (
    reservation.status === "cancelled" ||
    reservation.status === "cancelada" ||
    reservation.status === "completed" ||
    reservation.status === "completada"
  ) {
    return NextResponse.json(
      { error: "La reserva ya no se puede modificar." },
      { status: 400 }
    );
  }

  let body: { reservation_date?: string; reservation_time?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const newDate = (body.reservation_date ?? "").trim();
  const newTime = ((body.reservation_time ?? "").trim() + ":00").slice(0, 8);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate) || !/^\d{2}:\d{2}/.test(newTime)) {
    return NextResponse.json(
      { error: "Fecha u hora inválidas." },
      { status: 400 }
    );
  }

  const now = new Date();
  const target = new Date(`${newDate}T${newTime}`);
  if (target.getTime() <= now.getTime()) {
    return NextResponse.json(
      { error: "La nueva fecha/hora debe ser futura." },
      { status: 400 }
    );
  }

  if (reservation.table_id) {
    const { ok, used, capacity } = await canFitInZone(
      reservation.table_id as string,
      newDate,
      newTime,
      Number(reservation.guests),
      reservation.id
    );
    if (!ok) {
      return NextResponse.json(
        {
          error:
            capacity === 0
              ? "Zona no encontrada."
              : `No hay plazas en esa zona a esa hora (${used}/${capacity}).`,
        },
        { status: 400 }
      );
    }
  }

  const duplicate = await hasDuplicateReservation(
    RESTAURANT_ID!,
    newDate,
    newTime,
    reservation.customer_email ?? null,
    reservation.customer_phone ?? null,
    reservation.id,
    reservation.meal_type ?? null
  );
  if (duplicate) {
    return NextResponse.json(
      { error: "Ya tienes otra reserva para ese día." },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("reservations")
    .update({
      reservation_date: newDate,
      reservation_time: newTime,
    })
    .eq("id", reservation.id);

  if (error) {
    return NextResponse.json(
      { error: "No se pudo actualizar la reserva." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const loaded = await loadOwnedReservation(params.id, user.id);
  if (loaded.error)
    return NextResponse.json({ error: loaded.error }, { status: loaded.code });

  const reservation = loaded.reservation!;

  if (
    reservation.status === "cancelled" ||
    reservation.status === "cancelada"
  ) {
    return NextResponse.json(
      { error: "La reserva ya estaba cancelada." },
      { status: 400 }
    );
  }

  const restaurantMeta = (reservation.restaurant ?? {}) as {
    refund_window_hours?: number | null;
    stripe_account_id?: string | null;
  };
  const refundWindowHours = Number(restaurantMeta.refund_window_hours ?? 48);

  const diffHours =
    (new Date(
      `${reservation.reservation_date}T${reservation.reservation_time}`
    ).getTime() -
      Date.now()) /
    (1000 * 60 * 60);

  const canRefund =
    reservation.deposit_paid &&
    reservation.stripe_payment_intent &&
    diffHours >= refundWindowHours;

  let refundId: string | null = null;
  if (canRefund) {
    try {
      const refund = await stripe.refunds.create(
        { payment_intent: reservation.stripe_payment_intent as string },
        restaurantMeta.stripe_account_id
          ? { stripeAccount: restaurantMeta.stripe_account_id }
          : undefined
      );
      refundId = refund.id;
    } catch (e) {
      console.error("Stripe refund failed", e);
    }
  }

  const { error } = await supabaseAdmin
    .from("reservations")
    .update({
      status: "cancelled",
      deposit_paid: canRefund ? false : reservation.deposit_paid,
      refund_id: refundId,
      refund_status: canRefund ? "processed" : null,
      refunded_at: canRefund ? new Date().toISOString() : null,
    })
    .eq("id", reservation.id);

  if (error) {
    return NextResponse.json(
      { error: "No se pudo cancelar la reserva." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, refunded: canRefund });
}

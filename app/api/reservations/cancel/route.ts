"use server";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { stripeServer as stripe } from "@/lib/stripe-server";

export async function POST(req: NextRequest) {
  try {
    const { reservation_id, email, phone } = await req.json();

    if (!reservation_id) {
      return NextResponse.json(
        { error: "reservation_id is required" },
        { status: 400 }
      );
    }
    const emailNorm =
      typeof email === "string" ? email.trim().toLowerCase() : "";
    const phoneNorm =
      typeof phone === "string" ? phone.trim().replace(/\s/g, "") : "";
    if (!emailNorm && !phoneNorm) {
      return NextResponse.json(
        { error: "Email o teléfono son obligatorios" },
        { status: 400 }
      );
    }

    // 1) Cargar reserva + restaurante
    const { data: reservation, error } = await supabaseAdmin
      .from("reservations")
      .select("*, restaurant:restaurants(name, refund_window_hours)")
      .eq("id", reservation_id)
      .single();

    if (error || !reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    if (reservation.status === "cancelled") {
      return NextResponse.json(
        { error: "Reservation already cancelled" },
        { status: 400 }
      );
    }

    // Validar que quien cancela sea el mismo cliente (email o teléfono)
    const rEmail = ((reservation.customer_email as string) || "")
      .trim()
      .toLowerCase();
    const rPhone = ((reservation.customer_phone as string) || "").replace(
      /\s/g,
      ""
    );
    const matches =
      (emailNorm && rEmail && emailNorm === rEmail) ||
      (phoneNorm && rPhone && phoneNorm === rPhone);
    if (!matches) {
      return NextResponse.json(
        { error: "No se ha podido verificar la reserva con esos datos" },
        { status: 403 }
      );
    }

    const restaurantMeta = reservation.restaurant as unknown as
      | { refund_window_hours?: number | null }
      | null
      | undefined;
    const refundWindowHours = Number(restaurantMeta?.refund_window_hours ?? 48);

    // 2) Comprobar si falta >= refundWindowHours
    const reservationDateTime = new Date(
      `${reservation.reservation_date}T${reservation.reservation_time}`
    );
    const now = new Date();
    const diffMs = reservationDateTime.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    const canRefund =
      reservation.deposit_paid &&
      reservation.stripe_payment_intent &&
      diffHours >= refundWindowHours;

    // 3) Si toca reembolso -> refund en Stripe
    let refundId: string | null = null;
    if (canRefund) {
      const refund = await stripe.refunds.create({
        payment_intent: reservation.stripe_payment_intent,
      });
      refundId = refund.id;
    }

    // 4) Actualizar estado
    const { data: cancelled, error: updateError } = await supabaseAdmin
      .from("reservations")
      .update({
        status: "cancelled",
        deposit_paid: canRefund ? false : reservation.deposit_paid,
        refund_id: refundId,
        refund_status: canRefund ? "processed" : null,
        refunded_at: canRefund ? new Date().toISOString() : null,
      })
      .eq("id", reservation.id)
      .select("*, restaurant:restaurants(name)")
      .single();

    if (updateError || !cancelled) {
      console.error(updateError);
      return NextResponse.json(
        { error: "Error updating reservation" },
        { status: 500 }
      );
    }

    // Nota: no enviamos emails automáticos (cancelación/reembolso). El estado
    // queda visible en el área del cliente. Las notificaciones manuales se
    // gestionan por WhatsApp desde el dashboard.

    return NextResponse.json(
      { ok: true, refunded: canRefund },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error cancelling reservation", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


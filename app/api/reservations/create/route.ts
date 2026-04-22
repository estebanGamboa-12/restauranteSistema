"use server";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { syncReservationCustomerLink } from "@/lib/customer-records";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

const ENV_RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID;
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "").trim();
const IS_LIVE = (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_live_");

export async function POST(req: NextRequest) {
  try {
    if (IS_LIVE && (!APP_URL || !APP_URL.startsWith("https://"))) {
      return NextResponse.json(
        {
          error:
            "Stripe LIVE requiere redirecciones HTTPS. Usa claves TEST en local o configura NEXT_PUBLIC_APP_URL con https://.",
        },
        { status: 400 }
      );
    }

    const body = await req.json();

    const {
      restaurant_id,
      reservation_date,
      reservation_time,
      guests,
      name,
      email,
      phone,
      notes,
      zonePreference,
      mealType,
      marketingOptIn,
      marketingChannelEmail,
      marketingChannelWhatsapp,
    } = body;

    const effectiveRestaurantId =
      (typeof restaurant_id === "string" && restaurant_id.trim()) ||
      ENV_RESTAURANT_ID ||
      "";

    if (
      !effectiveRestaurantId ||
      !reservation_date ||
      !reservation_time ||
      !guests ||
      !name
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Single-tenant by env: no permitir crear reservas para otros restaurantes.
    if (ENV_RESTAURANT_ID && effectiveRestaurantId !== ENV_RESTAURANT_ID) {
      return NextResponse.json(
        { error: "Restaurant not allowed" },
        { status: 403 }
      );
    }

    // 1) Obtener restaurante (deposito, stripe_account_id)
    const { data: restaurant, error: restaurantError } = await supabaseAdmin
      .from("restaurants")
      .select("id, name, deposit_amount, stripe_account_id")
      .eq("id", effectiveRestaurantId)
      .single();

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    if (!restaurant.stripe_account_id) {
      return NextResponse.json(
        { error: "Restaurant has no Stripe account configured" },
        { status: 400 }
      );
    }

    const depositPerPerson: number = Math.max(0, Number(restaurant.deposit_amount ?? 0));
    const totalDeposit = depositPerPerson * Number(guests);

    const zoneName =
      typeof zonePreference === "string" ? zonePreference.trim() : "";
    if (!zoneName) {
      return NextResponse.json(
        { error: "Debes elegir una zona (por ejemplo Terraza o Dentro)." },
        { status: 400 }
      );
    }

    const mealTypeNorm =
      mealType === "comida" || mealType === "cena" ? mealType : null;

    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para reservar." },
        { status: 401 }
      );
    }
    const customerEmail =
      (typeof email === "string" && email.trim()) || user.email || null;

    const { canFitInZone, hasDuplicateReservation } = await import(
      "@/lib/zone-capacity"
    );

    const duplicate = await hasDuplicateReservation(
      effectiveRestaurantId,
      reservation_date,
      reservation_time,
      customerEmail,
      typeof phone === "string" ? phone : null,
      undefined,
      mealTypeNorm
    );
    if (duplicate) {
      return NextResponse.json(
        {
          error:
            "Ya tienes una reserva para esa franja el mismo día (mismo email o teléfono).",
        },
        { status: 400 }
      );
    }

    // 2) Buscar zona por nombre y comprobar capacidad por franja (sum guests)
    const { data: zoneRow, error: zoneError } = await supabaseAdmin
      .from("tables")
      .select("id, capacity, name")
      .eq("restaurant_id", effectiveRestaurantId)
      .eq("name", zoneName)
      .order("capacity", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (zoneError || !zoneRow?.id) {
      return NextResponse.json({ error: "Zona no encontrada." }, { status: 400 });
    }

    const { ok: fits, used, capacity } = await canFitInZone(
      zoneRow.id as string,
      reservation_date,
      reservation_time,
      Number(guests)
    );
    if (!fits) {
      return NextResponse.json(
        {
          error:
            capacity === 0
              ? "Zona no encontrada."
              : `No hay plazas suficientes en ${zoneName} para esa hora (${used}/${capacity} comensales).`,
        },
        { status: 400 }
      );
    }

    // 3) Crear reserva pending
    const { data: reservation, error: reservationError } = await supabaseAdmin
      .from("reservations")
      .insert({
        restaurant_id: effectiveRestaurantId,
        table_id: zoneRow.id,
        customer_name: name,
        customer_email: customerEmail,
        customer_phone: phone,
        guests,
        reservation_date,
        reservation_time,
        deposit_paid: false,
        deposit_amount: totalDeposit,
        meal_type: mealTypeNorm,
        status: "pending",
        notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
      })
      .select("*")
      .single();

    if (reservationError || !reservation) {
      console.error(reservationError);
      return NextResponse.json(
        { error: "Error creating reservation" },
        { status: 500 }
      );
    }

    await syncReservationCustomerLink({
      reservationId: reservation.id,
      restaurantId: effectiveRestaurantId,
      authUserId: user.id,
      name,
      email: customerEmail,
      phone,
      marketingOptIn: !!marketingOptIn,
      marketingChannelEmail: !!marketingChannelEmail,
      marketingChannelWhatsapp: !!marketingChannelWhatsapp,
      privacyAcceptedAt: new Date().toISOString(),
    });

    // 4) Stripe Checkout para depósito (cuenta conectada)
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "eur",
              unit_amount: depositPerPerson,
              product_data: {
                name: `Depósito reserva - ${restaurant.name}`,
                description: `Reserva ${reservation_date} ${reservation_time} (${guests} personas)`,
              },
            },
            quantity: Number(guests),
          },
        ],
        success_url: `${APP_URL}/reservas/success?reservation_id=${reservation.id}`,
        cancel_url: `${APP_URL}/reservas/cancel?reservation_id=${reservation.id}`,
        metadata: {
          reservation_id: reservation.id,
          restaurant_id: restaurant.id,
        },
      },
      {
        stripeAccount: restaurant.stripe_account_id,
      }
    );

    // Guardar ids de Stripe
    const { error: updateError } = await supabaseAdmin
      .from("reservations")
      .update({
        stripe_checkout_session_id: session.id,
        stripe_payment_intent: session.payment_intent?.toString() ?? null,
      })
      .eq("id", reservation.id);

    if (updateError) {
      console.error(updateError);
    }

    return NextResponse.json(
      {
        reservation_id: reservation.id,
        checkout_url: session.url,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating reservation", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


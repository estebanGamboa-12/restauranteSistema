"use server";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    console.error("Webhook signature verification failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const reservationId = session.metadata?.reservation_id;

    if (reservationId) {
      const { error } = await supabaseAdmin
        .from("reservations")
        .update({
          status: "confirmed",
          deposit_paid: true,
          stripe_payment_intent: session.payment_intent?.toString() ?? null,
        })
        .eq("id", reservationId);

      if (error) {
        console.error("Error updating reservation from webhook", error);
      }
      // Sin email automático: el cliente ve el estado en /account/reservations
      // y, si procede, el restaurante contacta por WhatsApp desde el dashboard.
    }
  }

  return NextResponse.json({ received: true });
}


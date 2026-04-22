"use server";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { requirePermission } from "@/lib/api-rbac";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export async function GET(req: NextRequest) {
  const staff = await requirePermission(req, "payments");
  if (staff instanceof NextResponse) return staff;
  const restaurantId = staff.restaurantId;

  const { data: restaurant, error } = await supabaseAdmin
    .from("restaurants")
    .select("id, stripe_account_id, deposit_amount, refund_window_hours")
    .eq("id", restaurantId)
    .single();

  if (error || !restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const stripeAccountId = (restaurant.stripe_account_id as string | null) ?? null;
  const depositAmount = Number(restaurant.deposit_amount ?? 0);
  const refundWindowHours = Number(restaurant.refund_window_hours ?? 48);

  let stripeAccount: Stripe.Account | null = null;
  if (stripeAccountId) {
    try {
      stripeAccount = await stripe.accounts.retrieve(stripeAccountId);
    } catch {
      stripeAccount = null;
    }
  }

  return NextResponse.json({
    stripe_account_id: stripeAccountId,
    deposit_amount: depositAmount,
    refund_window_hours: refundWindowHours,
    stripe: stripeAccount
      ? {
          charges_enabled: !!stripeAccount.charges_enabled,
          details_submitted: !!stripeAccount.details_submitted,
          payouts_enabled: !!stripeAccount.payouts_enabled,
          requirements: stripeAccount.requirements ?? null,
        }
      : null,
  });
}

export async function PUT(req: NextRequest) {
  const staff = await requirePermission(req, "payments");
  if (staff instanceof NextResponse) return staff;
  const restaurantId = staff.restaurantId;

  const body = await req.json();
  const depositAmount = Number(body.deposit_amount);
  const refundWindowHours = Number(body.refund_window_hours);
  if (!Number.isFinite(depositAmount) || depositAmount < 0 || depositAmount > 1000000) {
    return NextResponse.json(
      { error: "deposit_amount inválido" },
      { status: 400 }
    );
  }
  if (!Number.isFinite(refundWindowHours) || refundWindowHours < 0 || refundWindowHours > 720) {
    return NextResponse.json(
      { error: "refund_window_hours inválido" },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("restaurants")
    .update({
      deposit_amount: Math.round(depositAmount),
      refund_window_hours: Math.round(refundWindowHours),
    })
    .eq("id", restaurantId);

  if (error) {
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
  }

  return NextResponse.json({ message: "Guardado" });
}


"use server";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { requirePermission } from "@/lib/api-rbac";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export async function POST(req: NextRequest) {
  try {
    const staff = await requirePermission(req, "payments");
    if (staff instanceof NextResponse) return staff;
    const restaurantId = staff.restaurantId;

    const { data: restaurant, error } = await supabaseAdmin
      .from("restaurants")
      .select("stripe_account_id")
      .eq("id", restaurantId)
      .single();

    if (error || !restaurant?.stripe_account_id) {
      return NextResponse.json(
        { error: "Stripe no está conectado" },
        { status: 400 }
      );
    }

    const link = await stripe.accounts.createLoginLink(
      restaurant.stripe_account_id as string
    );

    return NextResponse.json({ url: link.url });
  } catch (e) {
    console.error("Error creating Stripe login link", e);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}


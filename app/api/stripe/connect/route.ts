"use server";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { requirePermission } from "@/lib/api-rbac";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

function getErrorMessage(err: unknown): string | undefined {
  if (!err || typeof err !== "object") return undefined;
  const e = err as { message?: unknown; raw?: { message?: unknown } };
  const rawMsg = e.raw?.message;
  if (typeof rawMsg === "string" && rawMsg.length > 0) return rawMsg;
  const msg = e.message;
  if (typeof msg === "string" && msg.length > 0) return msg;
  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    const staff = await requirePermission(req, "payments");
    if (staff instanceof NextResponse) return staff;
    const restaurantId = staff.restaurantId;

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").trim();
    const isLive = (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_live_");
    if (isLive && (!appUrl || !appUrl.startsWith("https://"))) {
      return NextResponse.json(
        {
          error:
            "Estás usando Stripe en LIVE y Stripe exige URLs HTTPS para redirecciones. Solución: usa claves de TEST (sk_test) en local, o expón tu app con HTTPS (ngrok/Cloudflare Tunnel) y pon NEXT_PUBLIC_APP_URL=https://...",
        },
        { status: 400 }
      );
    }

    // 1) Leer restaurante actual
    const { data: restaurant, error: restaurantError } = await supabaseAdmin
      .from("restaurants")
      .select("id, name, stripe_account_id")
      .eq("id", restaurantId)
      .single();

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    const createAndPersistStripeAccount = async (): Promise<string> => {
      const account = await stripe.accounts.create({
        type: "express",
        country: "ES",
        business_type: "company",
        business_profile: {
          name: restaurant.name ?? "Restaurant",
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      const stripeAccountId = account.id;
      const { error: updateError } = await supabaseAdmin
        .from("restaurants")
        .update({ stripe_account_id: stripeAccountId })
        .eq("id", restaurant.id);

      if (updateError) {
        console.error("Error saving stripe_account_id", updateError);
      }
      return stripeAccountId;
    };

    // 2) Usar cuenta existente o crear nueva
    let stripeAccountId = (restaurant.stripe_account_id as string | null) || null;
    if (!stripeAccountId) {
      stripeAccountId = await createAndPersistStripeAccount();
    }

    // 3) Generar enlace de onboarding
    const refreshUrl = `${appUrl}/dashboard/payments?stripe=refresh`;
    const returnUrl = `${appUrl}/dashboard/payments?stripe=return`;

    let accountLink: Stripe.AccountLink | null = null;
    try {
      accountLink = await stripe.accountLinks.create({
        account: stripeAccountId!,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: "account_onboarding",
      });
    } catch (error) {
      const stripeMsg = getErrorMessage(error);

      // Esto pasa cuando cambias de TEST<->LIVE o cambias de plataforma:
      // el stripe_account_id guardado ya no pertenece a esta cuenta plataforma.
      if (
        typeof stripeMsg === "string" &&
        stripeMsg.toLowerCase().includes("account link") &&
        stripeMsg.toLowerCase().includes("not connected to your platform")
      ) {
        // Resetear el account id y crear uno nuevo para esta plataforma
        await supabaseAdmin
          .from("restaurants")
          .update({ stripe_account_id: null })
          .eq("id", restaurant.id);

        stripeAccountId = await createAndPersistStripeAccount();
        accountLink = await stripe.accountLinks.create({
          account: stripeAccountId!,
          refresh_url: refreshUrl,
          return_url: returnUrl,
          type: "account_onboarding",
        });
      } else {
        throw error;
      }
    }

    return NextResponse.json(
      {
        url: accountLink!.url,
        message: "Stripe onboarding link created",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error starting Stripe Connect onboarding", error);

    // Make Stripe errors actionable in the UI.
    const stripeMsg = getErrorMessage(error);

    if (
      typeof stripeMsg === "string" &&
      stripeMsg.toLowerCase().includes("managing losses for connected accounts")
    ) {
      return NextResponse.json(
        {
          error:
            "Stripe Connect no está configurado en tu cuenta de plataforma. En Stripe Dashboard ve a Settings → Connect → Platform profile y revisa/acepta la responsabilidad de 'managing losses for connected accounts'. Luego vuelve a intentar.",
        },
        { status: 400 }
      );
    }

    if (typeof stripeMsg === "string" && stripeMsg.length > 0) {
      return NextResponse.json({ error: stripeMsg }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder";

export const stripeServer = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2026-02-25.clover",
});

"use server";

import { supabaseAdmin } from "@/lib/supabase";

type SyncArgs = {
  reservationId: string;
  restaurantId: string;
  authUserId?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  /**
   * Preferencias de marketing. Son opcionales porque las reservas creadas
   * desde el dashboard (sin consentimiento explícito) no tocan estos flags.
   * Si no se pasan, no se actualizan en la fila existente y se guardan como
   * false en insert inicial.
   */
  marketingOptIn?: boolean;
  marketingChannelEmail?: boolean;
  marketingChannelWhatsapp?: boolean;
  privacyAcceptedAt?: string | null;
};

/**
 * Crea (o actualiza) la fila `customers` del cliente que hace la reserva
 * y la vincula al `reservations.customer_id`. Prioriza el enlace por user_id
 * (cliente registrado) y, si no hay, enlaza por email en el mismo restaurante.
 */
export async function syncReservationCustomerLink(
  args: SyncArgs
): Promise<{ customerId: string | null }> {
  const {
    reservationId,
    restaurantId,
    authUserId = null,
    name,
    email,
    phone,
    marketingOptIn,
    marketingChannelEmail,
    marketingChannelWhatsapp,
    privacyAcceptedAt,
  } = args;

  const emailNorm = email ? email.trim().toLowerCase() : null;
  const phoneNorm = phone ? phone.trim() : null;

  let customerId: string | null = null;

  try {
    if (authUserId) {
      const { data } = await supabaseAdmin
        .from("customers")
        .select("id")
        .eq("restaurant_id", restaurantId)
        .eq("user_id", authUserId)
        .maybeSingle();
      if (data?.id) customerId = data.id;
    }

    if (!customerId && emailNorm) {
      const { data } = await supabaseAdmin
        .from("customers")
        .select("id")
        .eq("restaurant_id", restaurantId)
        .ilike("email", emailNorm)
        .maybeSingle();
      if (data?.id) customerId = data.id;
    }

    if (customerId) {
      await supabaseAdmin
        .from("customers")
        .update({
          name: name || undefined,
          email: emailNorm || undefined,
          phone: phoneNorm || undefined,
          user_id: authUserId ?? undefined,
          marketing_opt_in: marketingOptIn,
          marketing_channel_email: marketingChannelEmail,
          marketing_channel_whatsapp: marketingChannelWhatsapp,
          privacy_accepted_at: privacyAcceptedAt ?? undefined,
        })
        .eq("id", customerId);
    } else {
      const { data: inserted } = await supabaseAdmin
        .from("customers")
        .insert({
          restaurant_id: restaurantId,
          user_id: authUserId,
          name,
          email: emailNorm,
          phone: phoneNorm,
          marketing_opt_in: marketingOptIn ?? false,
          marketing_channel_email: marketingChannelEmail ?? false,
          marketing_channel_whatsapp: marketingChannelWhatsapp ?? false,
          privacy_accepted_at: privacyAcceptedAt,
        })
        .select("id")
        .maybeSingle();
      customerId = inserted?.id ?? null;
    }

    if (customerId) {
      await supabaseAdmin
        .from("reservations")
        .update({ customer_id: customerId })
        .eq("id", reservationId);
    }
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[syncReservationCustomerLink]", e);
    }
  }

  return { customerId };
}

/**
 * Upsert del perfil `customers` al confirmarse el registro (desde /auth/callback).
 * Vincula al auth.users.id y guarda consentimientos iniciales.
 */
export async function upsertCustomerFromAuth(args: {
  restaurantId: string;
  authUserId: string;
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  marketingOptIn?: boolean;
  marketingChannelEmail?: boolean;
  marketingChannelWhatsapp?: boolean;
}): Promise<{ customerId: string | null }> {
  const {
    restaurantId,
    authUserId,
    email,
    name,
    phone,
    marketingOptIn = false,
    marketingChannelEmail = false,
    marketingChannelWhatsapp = false,
  } = args;

  const emailNorm = email ? email.trim().toLowerCase() : null;

  let customerId: string | null = null;

  try {
    const { data: byUser } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("restaurant_id", restaurantId)
      .eq("user_id", authUserId)
      .maybeSingle();
    if (byUser?.id) customerId = byUser.id;

    if (!customerId && emailNorm) {
      const { data: byEmail } = await supabaseAdmin
        .from("customers")
        .select("id, user_id")
        .eq("restaurant_id", restaurantId)
        .ilike("email", emailNorm)
        .maybeSingle();
      if (byEmail?.id) customerId = byEmail.id;
    }

    if (customerId) {
      await supabaseAdmin
        .from("customers")
        .update({
          user_id: authUserId,
          name: name || undefined,
          phone: phone || undefined,
          email: emailNorm || undefined,
          marketing_opt_in: marketingOptIn,
          marketing_channel_email: marketingChannelEmail,
          marketing_channel_whatsapp: marketingChannelWhatsapp,
        })
        .eq("id", customerId);
    } else {
      const { data: inserted } = await supabaseAdmin
        .from("customers")
        .insert({
          restaurant_id: restaurantId,
          user_id: authUserId,
          name: name ?? (emailNorm ?? "Cliente"),
          email: emailNorm,
          phone: phone ?? null,
          marketing_opt_in: marketingOptIn,
          marketing_channel_email: marketingChannelEmail,
          marketing_channel_whatsapp: marketingChannelWhatsapp,
          privacy_accepted_at: new Date().toISOString(),
        })
        .select("id")
        .maybeSingle();
      customerId = inserted?.id ?? null;
    }
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[upsertCustomerFromAuth]", e);
    }
  }

  return { customerId };
}

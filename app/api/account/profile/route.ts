import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";
import { upsertCustomerFromAuth } from "@/lib/customer-records";

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID!;

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

  const { data } = await supabaseAdmin
    .from("customers")
    .select(
      "name, email, phone, marketing_opt_in, marketing_channel_email, marketing_channel_whatsapp"
    )
    .eq("restaurant_id", RESTAURANT_ID)
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({
    name: data?.name ?? user.user_metadata?.name ?? "",
    email: data?.email ?? user.email ?? "",
    phone: data?.phone ?? user.user_metadata?.phone ?? "",
    marketing_opt_in: !!data?.marketing_opt_in,
    marketing_channel_email: !!data?.marketing_channel_email,
    marketing_channel_whatsapp: !!data?.marketing_channel_whatsapp,
  });
}

export async function PUT(req: NextRequest) {
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

  let body: {
    name?: string;
    phone?: string;
    marketing_opt_in?: boolean;
    marketing_channel_email?: boolean;
    marketing_channel_whatsapp?: boolean;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const name = (body.name ?? "").toString().trim();
  const phone = (body.phone ?? "").toString().trim();

  if (!name) {
    return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
  }

  await upsertCustomerFromAuth({
    restaurantId: RESTAURANT_ID,
    authUserId: user.id,
    email: user.email ?? null,
    name,
    phone: phone || null,
    marketingOptIn: !!body.marketing_opt_in,
    marketingChannelEmail: !!body.marketing_channel_email,
    marketingChannelWhatsapp: !!body.marketing_channel_whatsapp,
  });

  return NextResponse.json({ ok: true });
}

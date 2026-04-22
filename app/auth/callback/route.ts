import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { upsertCustomerFromAuth } from "@/lib/customer-records";

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID;

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/account";

  if (code) {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && RESTAURANT_ID) {
      const meta = (user.user_metadata ?? {}) as {
        name?: string;
        phone?: string;
        marketing_opt_in?: boolean;
        marketing_channel_email?: boolean;
        marketing_channel_whatsapp?: boolean;
      };
      await upsertCustomerFromAuth({
        restaurantId: RESTAURANT_ID,
        authUserId: user.id,
        email: user.email ?? null,
        name: meta.name ?? null,
        phone: meta.phone ?? null,
        marketingOptIn: !!meta.marketing_opt_in,
        marketingChannelEmail: !!meta.marketing_channel_email,
        marketingChannelWhatsapp: !!meta.marketing_channel_whatsapp,
      });
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}

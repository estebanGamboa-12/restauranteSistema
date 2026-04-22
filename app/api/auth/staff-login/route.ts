"use server";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase";

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Login por nombre + contraseña (staff sin email visible).
 * Busca el empleado por nombre en el restaurante, usa el email interno y hace sign-in.
 * Devuelve la sesión para que el cliente la establezca.
 */
export async function POST(req: NextRequest) {
  if (!RESTAURANT_ID || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { error: "Configuración del servidor incompleta" },
      { status: 500 }
    );
  }

  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim().replace(/<[^>]*>/g, "") : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!name || !password) {
    return NextResponse.json(
      { error: "Nombre y contraseña son obligatorios" },
      { status: 400 }
    );
  }

  const { data: staffRow, error: staffError } = await supabaseAdmin
    .from("restaurant_staff")
    .select("email")
    .eq("restaurant_id", RESTAURANT_ID)
    .ilike("name", name)
    .limit(1)
    .maybeSingle();

  if (staffError) {
    console.error("[staff-login] Error buscando staff:", staffError.message);
    return NextResponse.json(
      { error: "Usuario o contraseña incorrectos" },
      { status: 401 }
    );
  }
  if (!staffRow?.email) {
    return NextResponse.json(
      { error: "No hay ningún empleado con ese nombre. Para entrar como admin usa tu email." },
      { status: 401 }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: staffRow.email,
    password,
  });

  if (authError || !authData.session) {
    return NextResponse.json(
      { error: "Usuario o contraseña incorrectos" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    access_token: authData.session.access_token,
    refresh_token: authData.session.refresh_token ?? "",
    expires_in: authData.session.expires_in,
  });
}

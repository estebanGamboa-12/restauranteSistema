"use server";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * One-time bootstrap endpoint to create a global admin Auth user
 * without touching Supabase dashboard manually.
 *
 * Security:
 * - Requires header: x-bootstrap-secret == process.env.DASHBOARD_BOOTSTRAP_SECRET
 * - Requires the email to be included in DASHBOARD_GLOBAL_ADMIN_EMAILS
 */

function parseGlobalAdminEmails(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-bootstrap-secret") ?? "";
  const expectedSecret = process.env.DASHBOARD_BOOTSTRAP_SECRET ?? "";

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email no válido" }, { status: 400 });
  }
  if (!password || password.length < 6) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 6 caracteres" },
      { status: 400 }
    );
  }

  const globalAdmins = parseGlobalAdminEmails(
    process.env.DASHBOARD_GLOBAL_ADMIN_EMAILS
  );
  if (!globalAdmins.includes(email)) {
    return NextResponse.json(
      {
        error:
          "Este email no está permitido. Añádelo a DASHBOARD_GLOBAL_ADMIN_EMAILS.",
      },
      { status: 403 }
    );
  }

  // If user already exists, return ok (idempotent-ish)
  const { data: existing } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const already = (existing?.users ?? []).find(
    (u) => (u.email ?? "").toLowerCase() === email
  );
  if (already?.id) {
    // Si ya existe, actualizamos contraseña para que puedas rotarla sin panel de Supabase.
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      already.id,
      { password }
    );
    if (updateError) {
      console.error("[bootstrap-admin] updateUser error", updateError);
      return NextResponse.json(
        { error: "No se pudo actualizar la contraseña del admin global" },
        { status: 500 }
      );
    }
    return NextResponse.json({
      message: "Admin global ya existe (contraseña actualizada)",
      user_id: already.id,
    });
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: "global_admin" },
  });

  if (error || !data.user?.id) {
    console.error("[bootstrap-admin] createUser error", error);
    return NextResponse.json(
      { error: "No se pudo crear el admin global" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { message: "Admin global creado", user_id: data.user.id },
    { status: 201 }
  );
}


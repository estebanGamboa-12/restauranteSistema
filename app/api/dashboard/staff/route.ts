"use server";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requirePermission } from "@/lib/api-rbac";

export async function GET(req: NextRequest) {
  const staff = await requirePermission(req, "staff");
  if (staff instanceof NextResponse) return staff;
  const restaurantId = staff.restaurantId;

  const { data, error } = await supabaseAdmin
    .from("restaurant_staff")
    .select("id, user_id, name, email, role, created_at")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading staff", error);
    return NextResponse.json(
      { error: "Error al cargar el personal" },
      { status: 500 }
    );
  }

  return NextResponse.json({ staff: data ?? [] });
}

export async function POST(req: NextRequest) {
  const staff = await requirePermission(req, "staff");
  if (staff instanceof NextResponse) return staff;
  const restaurantId = staff.restaurantId;

  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim().replace(/<[^>]*>/g, "") : "";
  const email =
    typeof body.email === "string"
      ? body.email.trim().toLowerCase().replace(/<[^>]*>/g, "")
      : "";
  const roleRaw = typeof body.role === "string" ? body.role.trim() : "";
  const role = roleRaw && roleRaw !== "admin" ? roleRaw : "staff";
  const password = typeof body.password === "string" ? body.password : "";

  if (!name) {
    return NextResponse.json(
      { error: "El nombre es obligatorio" },
      { status: 400 }
    );
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "El email es obligatorio y debe ser válido" },
      { status: 400 }
    );
  }
  if (!password || password.length < 6) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 6 caracteres" },
      { status: 400 }
    );
  }

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (authError) {
    console.error("Error creating auth user", authError);
    return NextResponse.json(
      { error: "Error al crear el usuario" },
      { status: 500 }
    );
  }

  if (!authUser?.user?.id) {
    return NextResponse.json(
      { error: "Error al crear el usuario" },
      { status: 500 }
    );
  }

  const { error: insertError } = await supabaseAdmin.from("restaurant_staff").insert({
    restaurant_id: restaurantId,
    user_id: authUser.user.id,
    name,
    email,
    role,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json(
        { error: "Ese usuario ya pertenece al restaurante" },
        { status: 400 }
      );
    }
    console.error("Error inserting restaurant_staff", insertError);
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json(
      { error: "Error al guardar el empleado" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { message: "Empleado creado correctamente" },
    { status: 201 }
  );
}

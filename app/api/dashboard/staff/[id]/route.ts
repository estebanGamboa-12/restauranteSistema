"use server";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requirePermission } from "@/lib/api-rbac";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const staff = await requirePermission(req, "staff");
  if (staff instanceof NextResponse) return staff;
  const restaurantId = staff.restaurantId;
  const id = params.id;

  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim().replace(/<[^>]*>/g, "") : "";
  const email =
    typeof body.email === "string"
      ? body.email.trim().toLowerCase().replace(/<[^>]*>/g, "")
      : "";
  const roleRaw = typeof body.role === "string" ? body.role.trim() : "";
  const role = roleRaw && roleRaw !== "admin" ? roleRaw : undefined;
  const newPassword = typeof body.password === "string" ? body.password.trim() : "";

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

  const { data: row, error: fetchError } = await supabaseAdmin
    .from("restaurant_staff")
    .select("user_id")
    .eq("id", id)
    .eq("restaurant_id", restaurantId)
    .single();

  if (fetchError || !row) {
    return NextResponse.json(
      { error: "Empleado no encontrado" },
      { status: 404 }
    );
  }

  if (newPassword.length > 0 && newPassword.length < 6) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 6 caracteres" },
      { status: 400 }
    );
  }
  const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
    row.user_id as string,
    {
      email,
      user_metadata: { name },
    }
  );
  if (authUpdateError) {
    console.error("Error updating auth user", authUpdateError);
    return NextResponse.json(
      { error: "Error al actualizar el email del empleado" },
      { status: 500 }
    );
  }

  if (newPassword.length > 0) {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      row.user_id as string,
      { password: newPassword }
    );
    if (authError) {
      console.error("Error updating password", authError);
      return NextResponse.json(
        { error: "Error al actualizar la contraseña" },
        { status: 500 }
      );
    }
  }

  const updates: { name: string; email: string; role?: string } = { name, email };
  if (role) updates.role = role;

  const { error } = await supabaseAdmin
    .from("restaurant_staff")
    .update(updates)
    .eq("id", id)
    .eq("restaurant_id", restaurantId);

  if (error) {
    console.error("Error updating staff", error);
    return NextResponse.json(
      { error: "Error al actualizar el empleado" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: "Empleado actualizado correctamente",
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const staff = await requirePermission(req, "staff");
  if (staff instanceof NextResponse) return staff;
  const restaurantId = staff.restaurantId;
  const id = params.id;

  const { data: row } = await supabaseAdmin
    .from("restaurant_staff")
    .select("user_id")
    .eq("id", id)
    .eq("restaurant_id", restaurantId)
    .single();

  const { error } = await supabaseAdmin
    .from("restaurant_staff")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", restaurantId);

  if (error) {
    console.error("Error deleting staff", error);
    return NextResponse.json(
      { error: "Error al eliminar el empleado" },
      { status: 500 }
    );
  }

  if (row?.user_id) {
    await supabaseAdmin.auth.admin.deleteUser(row.user_id as string);
  }

  return NextResponse.json({
    message: "Empleado eliminado correctamente",
  });
}

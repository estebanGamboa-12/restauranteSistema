"use server";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requirePermission } from "@/lib/api-rbac";

export async function GET(req: NextRequest) {
  const staff = await requirePermission(req, "tables");
  if (staff instanceof NextResponse) return staff;
  const restaurantId = staff.restaurantId;

  const { data, error } = await supabaseAdmin
    .from("tables")
    .select("id, name, capacity")
    .eq("restaurant_id", restaurantId)
    .order("name", { ascending: true });

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error al cargar las zonas" },
      { status: 500 }
    );
  }

  return NextResponse.json({ tables: data ?? [] });
}

export async function POST(req: NextRequest) {
  const staff = await requirePermission(req, "tables_edit");
  if (staff instanceof NextResponse) return staff;
  const restaurantId = staff.restaurantId;

  const body = await req.json();
  const { nombre, capacidad } = body;

  const name =
    typeof nombre === "string" ? nombre.trim().replace(/<[^>]*>/g, "") : "";
  const capacityNumber = Number(capacidad);

  if (!name) {
    return NextResponse.json(
      { error: "Campo obligatorio" },
      { status: 400 }
    );
  }

  if (!Number.isFinite(capacityNumber) || capacityNumber <= 0) {
    return NextResponse.json(
      { error: "Capacidad debe ser un número válido mayor que 0" },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin.from("tables").insert({
    restaurant_id: restaurantId,
    name,
    capacity: capacityNumber,
  });

  if (error) {
    console.error("Error creating table", error);
    return NextResponse.json(
      { error: "Error al crear la zona" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { message: "Zona creada correctamente" },
    { status: 201 }
  );
}


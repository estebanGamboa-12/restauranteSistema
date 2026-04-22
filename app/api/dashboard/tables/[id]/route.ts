 "use server";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requirePermission } from "@/lib/api-rbac";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const staff = await requirePermission(req, "tables_edit");
  if (staff instanceof NextResponse) return staff;
  const restaurantId = staff.restaurantId;

  const { id } = params;
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

  const { error } = await supabaseAdmin
    .from("tables")
    .update({
      name,
      capacity: capacityNumber,
    })
    .eq("id", id)
    .eq("restaurant_id", restaurantId);

  if (error) {
    console.error("Error updating table", error);
    return NextResponse.json(
      { error: "Error al actualizar la zona" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { message: "Zona actualizada correctamente" },
    { status: 200 }
  );
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const staff = await requirePermission(req, "tables_edit");
  if (staff instanceof NextResponse) return staff;
  const restaurantId = staff.restaurantId;

  const { id } = params;

  const { count, error: countError } = await supabaseAdmin
    .from("reservations")
    .select("*", { count: "exact", head: true })
    .eq("table_id", id)
    .eq("restaurant_id", restaurantId)
    .in("status", ["pending", "confirmed"]);

  if (!countError && typeof count === "number" && count > 0) {
    return NextResponse.json(
      {
        error: `No se puede eliminar la zona: tiene ${count} reserva(s) asociada(s). Reasigna esas reservas a otra zona o cancélalas antes de eliminar.`,
      },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("tables")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", restaurantId);

  if (error) {
    console.error("Error deleting table", error);
    const isFk = error.code === "23503" || error.message?.includes("foreign key");
    return NextResponse.json(
      {
        error: isFk
          ? "No se puede eliminar la zona porque tiene reservas asociadas. Reasigna o cancela esas reservas primero."
          : "Error al eliminar la zona",
      },
      { status: isFk ? 400 : 500 }
    );
  }

  return NextResponse.json(
    { message: "Zona eliminada correctamente" },
    { status: 200 }
  );
}


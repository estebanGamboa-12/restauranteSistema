"use server";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requirePermission } from "@/lib/api-rbac";
import { syncReservationCustomerLink } from "@/lib/customer-records";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const staff = await requirePermission(req, "reservations");
  if (staff instanceof NextResponse) return staff;
  const restaurantId = staff.restaurantId;

  const id = params.id;
  const body = await req.json();
  const {
    nombre,
    email,
    telefono,
    personas,
    fecha,
    hora,
    mesaId,
    notas,
  } = body;

  const name =
    typeof nombre === "string" ? nombre.trim().replace(/<[^>]*>/g, "") : "";
  const mail =
    typeof email === "string" ? email.trim().replace(/<[^>]*>/g, "") : "";
  const phone =
    typeof telefono === "string"
      ? telefono.trim().replace(/<[^>]*>/g, "")
      : "";
  const guests = Number(personas);
  const date = typeof fecha === "string" ? fecha : "";
  const time = typeof hora === "string" ? hora : "";
  const tableId = typeof mesaId === "string" ? mesaId : "";
  const notes = typeof notas === "string" ? notas.trim() : "";

  if (!name || !guests || !date || !time || !tableId) {
    return NextResponse.json(
      { error: "Campo obligatorio" },
      { status: 400 }
    );
  }

  if (guests < 1 || guests > 20) {
    return NextResponse.json(
      { error: "El número de personas debe estar entre 1 y 20" },
      { status: 400 }
    );
  }

  if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
    return NextResponse.json(
      { error: "Email no válido" },
      { status: 400 }
    );
  }

  if (phone && !/^[0-9+\s\-().]{6,20}$/.test(phone)) {
    return NextResponse.json(
      { error: "Teléfono no válido" },
      { status: 400 }
    );
  }

  const { canFitInZone, hasDuplicateReservation } = await import(
    "@/lib/zone-capacity"
  );

  const duplicate = await hasDuplicateReservation(
    restaurantId,
    date,
    time,
    mail || null,
    phone || null,
    id
  );
  if (duplicate) {
    return NextResponse.json(
      {
        error:
          "Este cliente ya tiene otra reserva para ese día. Solo se permite una reserva por persona (mismo email o teléfono) al día. Elige otro día o edita la otra reserva.",
      },
      { status: 400 }
    );
  }

  const { ok: fitsInZone, used, capacity } = await canFitInZone(
    tableId,
    date,
    time,
    guests,
    id
  );
  if (!fitsInZone) {
    return NextResponse.json(
      {
        error:
          capacity === 0
            ? "Zona no encontrada."
            : `No hay plazas suficientes en la zona para esa hora (${used}/${capacity} comensales). Elige otra hora o zona.`,
      },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("reservations")
    .update({
      table_id: tableId,
      customer_name: name,
      customer_email: mail || null,
      customer_phone: phone || null,
      guests,
      reservation_date: date,
      reservation_time: time,
      notes: notes || null,
    })
    .eq("id", id)
    .eq("restaurant_id", restaurantId);

  if (error) {
    console.error("Error updating reservation from dashboard", error);
    return NextResponse.json(
      { error: "Error al actualizar la reserva" },
      { status: 500 }
    );
  }

  await syncReservationCustomerLink({
    reservationId: id,
    restaurantId,
    name,
    email: mail || null,
    phone: phone || null,
  });

  return NextResponse.json(
    { message: "Reserva actualizada correctamente" },
    { status: 200 }
  );
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const staff = await requirePermission(req, "reservations_delete");
  if (staff instanceof NextResponse) return staff;
  const restaurantId = staff.restaurantId;

  const id = params.id;
  const { error } = await supabaseAdmin
    .from("reservations")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", restaurantId);

  if (error) {
    console.error("Error deleting reservation from dashboard", error);
    return NextResponse.json(
      { error: "Error al eliminar la reserva" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { message: "Reserva eliminada correctamente" },
    { status: 200 }
  );
}


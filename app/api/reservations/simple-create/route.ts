"use server";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { syncReservationCustomerLink } from "@/lib/customer-records";
import { resolveRestaurantContext } from "@/lib/restaurant-context";

export async function POST(req: NextRequest) {
  try {
    const restaurant = await resolveRestaurantContext(req);
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { message: "Debes iniciar sesión para reservar." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const rawName = typeof body.name === "string" ? body.name.trim() : "";
    const rawEmail = typeof body.email === "string" ? body.email.trim() : "";
    const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
    const rawDate = typeof body.date === "string" ? body.date.trim() : "";
    const rawTime = typeof body.time === "string" ? body.time.trim() : "";
    const rawGuests = Number(body.guests);
    const rawZone =
      typeof body.zonePreference === "string"
        ? body.zonePreference.trim()
        : "";
    const rawMealType =
      typeof body.mealType === "string" ? body.mealType.trim() : "";

    const name = rawName.replace(/<[^>]*>/g, "");
    const email = rawEmail.replace(/<[^>]*>/g, "");
    const phone = rawPhone.replace(/<[^>]*>/g, "");
    const date = rawDate;
    const time = rawTime;
    const guests = Number.isFinite(rawGuests) ? Math.floor(rawGuests) : 0;
    const zonePreference = rawZone || "";
    const mealType =
      rawMealType === "comida" || rawMealType === "cena" ? rawMealType : null;

    if (!name || !guests || !date || !time) {
      return NextResponse.json(
        { message: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    if (!zonePreference) {
      return NextResponse.json(
        { message: "Debes elegir una zona (por ejemplo Terraza o Dentro)." },
        { status: 400 }
      );
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: "Email no válido" },
        { status: 400 }
      );
    }

    if (phone && !/^[0-9+\s\-().]{6,20}$/.test(phone)) {
      return NextResponse.json(
        { message: "El teléfono no es válido" },
        { status: 400 }
      );
    }

    if (guests < 1 || guests > 500) {
      return NextResponse.json(
        { message: "El número de personas debe estar entre 1 y 500." },
        { status: 400 }
      );
    }

    if (!restaurant?.id) {
      return NextResponse.json(
        { message: "No se ha podido identificar el restaurante." },
        { status: 400 }
      );
    }

    // Asegurar que el restaurante existe (multi-tenant por env var).
    // No autogeneramos restaurantes aquí para evitar datos/branding incorrectos.
    const { data: restaurantRow, error: restaurantError } = await supabaseAdmin
      .from("restaurants")
      .select("id")
      .eq("id", restaurant.id)
      .single();

    if (restaurantError && restaurantError.code !== "PGRST116") {
      // PGRST116 = no rows; otros errores sí son relevantes
      console.error("Error loading restaurant", restaurantError);
      return NextResponse.json(
        {
          message:
            "Ha ocurrido un problema al identificar el restaurante. Inténtalo de nuevo en unos minutos.",
        },
        { status: 500 }
      );
    }

    if (!restaurantRow) {
      return NextResponse.json(
        {
          message:
            "Este restaurante aún no está configurado. Contacta con el restaurante o inténtalo más tarde.",
        },
        { status: 400 }
      );
    }

    // 1) Buscar mesa existente con capacidad suficiente
    let tableId: string | null = null;

    let baseQuery = supabaseAdmin
      .from("tables")
      .select("id, capacity, name")
      .eq("restaurant_id", restaurant.id)
      .gte("capacity", guests);

    baseQuery = baseQuery.eq("name", zonePreference);

    const { data: tables, error: tablesError } = await baseQuery
      .order("capacity", { ascending: true })
      .limit(1);

    if (tablesError) {
      console.error("Error loading tables", tablesError);
    }

    if (tables && tables.length > 0) {
      const zoneRow = tables[0];
      tableId = zoneRow.id as string;
      const zoneName = (zoneRow.name as string) || "esa zona";

      const { canFitInZone, hasDuplicateReservation } = await import(
        "@/lib/zone-capacity"
      );

      const duplicate = await hasDuplicateReservation(
        restaurant.id,
        date,
        time,
        email || null,
        phone || null,
        undefined,
        mealType
      );
      if (duplicate) {
        return NextResponse.json(
          {
            message:
              "Ya tienes una reserva para ese día. Solo se permite una reserva por persona (mismo email o teléfono) al día. Si quieres modificarla o cancelarla, contacta con el restaurante.",
          },
          { status: 400 }
        );
      }

      const { ok: fitsInZone, used, capacity } = await canFitInZone(
        tableId,
        date,
        time,
        guests
      );
      if (!fitsInZone) {
        return NextResponse.json(
          {
            message:
              capacity === 0
                ? "Zona no encontrada."
                : `No hay plazas suficientes en ${zoneName} para esa hora (${used}/${capacity} comensales). Prueba otra hora o zona.`,
          },
          { status: 400 }
        );
      }
    } else {
      // 2) No hay mesa con capacidad suficiente: reutilizar o crear "Online"
      const { data: onlineTable, error: onlineError } = await supabaseAdmin
        .from("tables")
        .select("id, capacity")
        .eq("restaurant_id", restaurant.id)
        .eq("name", "Online")
        .single();

      if (onlineError && onlineError.code !== "PGRST116") {
        console.error("Error loading Online table", onlineError);
      }

      if (onlineTable) {
        // Si ya existe, aseguramos que capacity >= guests
        if (onlineTable.capacity < guests) {
          const { error: updateCapError } = await supabaseAdmin
            .from("tables")
            .update({ capacity: guests })
            .eq("id", onlineTable.id);
          if (updateCapError) {
            console.error("Error updating Online table capacity", updateCapError);
          }
        }
        tableId = onlineTable.id as string;
      } else {
        const { data: newTable, error: newTableError } = await supabaseAdmin
          .from("tables")
          .insert({
            restaurant_id: restaurant.id,
            name: "Online",
            capacity: guests,
          })
          .select("id")
          .single();

        if (newTableError) {
          console.error("Error creating fallback table", newTableError);
          return NextResponse.json(
            {
              message:
                "Ha ocurrido un problema al preparar tu mesa. Inténtalo de nuevo en unos minutos.",
            },
            { status: 500 }
          );
        }

        tableId = newTable.id as string;
      }
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("reservations")
      .insert({
        restaurant_id: restaurant.id,
        table_id: tableId,
        customer_name: name,
        customer_email: email || user.email || null,
        customer_phone: phone,
        guests,
        reservation_date: date,
        reservation_time: time,
        meal_type: mealType,
        status: "pending",
        deposit_paid: false,
        deposit_amount: 0,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      console.error("Error inserting reservation", error);
      return NextResponse.json(
        {
          message: "No se ha podido registrar la reserva. Inténtalo de nuevo.",
        },
        { status: 500 }
      );
    }

    await syncReservationCustomerLink({
      reservationId: inserted.id,
      restaurantId: restaurant.id,
      authUserId: user.id,
      name,
      email: email || user.email || null,
      phone: phone || null,
      marketingOptIn: false,
      marketingChannelEmail: false,
      marketingChannelWhatsapp: false,
      privacyAcceptedAt: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        message:
          "Hemos recibido tu solicitud de reserva. Queda visible en tu área de cliente.",
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("Unexpected error in simple-create", e);
    return NextResponse.json(
      {
        message: "No se ha podido registrar la reserva. Inténtalo de nuevo.",
      },
      { status: 500 }
    );
  }
}


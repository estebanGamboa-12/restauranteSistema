import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID;

function slugify(input: string): string {
  return (input || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function formatPrice(cents: number): string {
  const euros = (cents || 0) / 100;
  return `${euros.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}

export async function GET() {
  if (!RESTAURANT_ID) {
    return NextResponse.json({ categories: [] });
  }

  const { data, error } = await supabaseAdmin
    .from("menu_items")
    .select(
      "id, section, name, description, price_cents, image_url, available, sort_order"
    )
    .eq("restaurant_id", RESTAURANT_ID)
    .eq("available", true)
    .order("section", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "No se pudo cargar la carta." },
      { status: 500 }
    );
  }

  const items = data ?? [];
  if (items.length === 0) {
    return NextResponse.json({ categories: [] });
  }

  const bySection = new Map<
    string,
    {
      id: string;
      title: string;
      dishes: {
        id: string;
        name: string;
        description: string;
        price: string;
        image: string;
      }[];
    }
  >();

  for (const item of items) {
    const sectionKey = slugify(item.section);
    if (!bySection.has(sectionKey)) {
      bySection.set(sectionKey, {
        id: sectionKey,
        title: item.section,
        dishes: [],
      });
    }
    bySection.get(sectionKey)!.dishes.push({
      id: String(item.id),
      name: item.name,
      description: item.description ?? "",
      price: formatPrice(Number(item.price_cents ?? 0)),
      image: item.image_url ?? "",
    });
  }

  return NextResponse.json({ categories: Array.from(bySection.values()) });
}

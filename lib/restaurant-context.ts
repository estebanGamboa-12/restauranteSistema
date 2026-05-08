import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const RESTAURANT_SLUG_COOKIE = "restaurant_slug";
export const RESTAURANT_ID_COOKIE = "restaurant_id";

export type RestaurantContext = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  country: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
};

function normalizeSlug(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim().toLowerCase();
  return trimmed || null;
}

function normalizeId(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed || null;
}

function mapRestaurantRow(
  row:
    | {
        id: string;
        slug: string;
        name: string;
        city?: string | null;
        country?: string | null;
        address?: string | null;
        phone?: string | null;
        email?: string | null;
      }
    | null
    | undefined
): RestaurantContext | null {
  if (!row?.id || !row.slug || !row.name) return null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    city: row.city ?? null,
    country: row.country ?? null,
    address: row.address ?? null,
    phone: row.phone ?? null,
    email: row.email ?? null,
  };
}

export async function getRestaurantBySlug(
  slug: string
): Promise<RestaurantContext | null> {
  const normalizedSlug = normalizeSlug(slug);
  if (!normalizedSlug) return null;

  const { data } = await supabaseAdmin
    .from("restaurants")
    .select("id, slug, name, city, country, address, phone, email")
    .eq("slug", normalizedSlug)
    .maybeSingle();

  return mapRestaurantRow(data);
}

export async function getRestaurantById(
  id: string
): Promise<RestaurantContext | null> {
  const normalizedId = normalizeId(id);
  if (!normalizedId) return null;

  const { data } = await supabaseAdmin
    .from("restaurants")
    .select("id, slug, name, city, country, address, phone, email")
    .eq("id", normalizedId)
    .maybeSingle();

  return mapRestaurantRow(data);
}

export async function listRestaurants(): Promise<RestaurantContext[]> {
  const { data } = await supabaseAdmin
    .from("restaurants")
    .select("id, slug, name, city, country, address, phone, email")
    .order("name", { ascending: true });

  return (data ?? [])
    .map((row) => mapRestaurantRow(row))
    .filter((row): row is RestaurantContext => Boolean(row));
}

export async function resolveRestaurantContext(
  req?: NextRequest
): Promise<RestaurantContext | null> {
  const searchSlug = normalizeSlug(req?.nextUrl.searchParams.get("restaurant"));
  const headerSlug = normalizeSlug(req?.headers.get("x-restaurant-slug"));
  const cookieSlug =
    normalizeSlug(req?.cookies.get(RESTAURANT_SLUG_COOKIE)?.value) ??
    normalizeSlug(cookies().get(RESTAURANT_SLUG_COOKIE)?.value);
  const envSlug = normalizeSlug(process.env.NEXT_PUBLIC_RESTAURANT_SLUG);

  for (const candidateSlug of [searchSlug, headerSlug, cookieSlug, envSlug]) {
    if (!candidateSlug) continue;
    const bySlug = await getRestaurantBySlug(candidateSlug);
    if (bySlug) return bySlug;
  }

  const headerId = normalizeId(req?.headers.get("x-restaurant-id"));
  const cookieId =
    normalizeId(req?.cookies.get(RESTAURANT_ID_COOKIE)?.value) ??
    normalizeId(cookies().get(RESTAURANT_ID_COOKIE)?.value);
  const envId = normalizeId(process.env.NEXT_PUBLIC_RESTAURANT_ID);

  for (const candidateId of [headerId, cookieId, envId]) {
    if (!candidateId) continue;
    const byId = await getRestaurantById(candidateId);
    if (byId) return byId;
  }

  const { data } = await supabaseAdmin
    .from("restaurants")
    .select("id, slug, name, city, country, address, phone, email")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return mapRestaurantRow(data);
}

export function applyRestaurantCookies(
  res: NextResponse,
  restaurant: Pick<RestaurantContext, "id" | "slug">
) {
  const cookieBase = {
    httpOnly: false,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };

  res.cookies.set({
    name: RESTAURANT_SLUG_COOKIE,
    value: restaurant.slug,
    ...cookieBase,
  });
  res.cookies.set({
    name: RESTAURANT_ID_COOKIE,
    value: restaurant.id,
    ...cookieBase,
  });
}

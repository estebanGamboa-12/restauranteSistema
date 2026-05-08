import { NextRequest, NextResponse } from "next/server";
import {
  applyRestaurantCookies,
  getRestaurantBySlug,
} from "@/lib/restaurant-context";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const restaurant = await getRestaurantBySlug(params.slug);
  const redirectPath = req.nextUrl.searchParams.get("redirect") || "/";
  const target = new URL(redirectPath, req.url);

  if (!restaurant) {
    return NextResponse.redirect(new URL("/restaurantes", req.url));
  }

  const res = NextResponse.redirect(target);
  applyRestaurantCookies(res, restaurant);
  return res;
}

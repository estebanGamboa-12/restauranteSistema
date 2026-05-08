import { NextResponse } from "next/server";
import {
  listRestaurants,
  resolveRestaurantContext,
} from "@/lib/restaurant-context";

export const dynamic = "force-dynamic";

export async function GET() {
  const [restaurants, activeRestaurant] = await Promise.all([
    listRestaurants(),
    resolveRestaurantContext(),
  ]);

  return NextResponse.json({
    restaurants,
    activeRestaurant,
  });
}

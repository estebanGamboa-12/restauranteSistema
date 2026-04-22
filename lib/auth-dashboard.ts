"use server";

import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { DashboardRole } from "@/lib/rbac";

export type StaffContext = {
  restaurantId: string;
  role: DashboardRole;
  userId?: string;
  name?: string | null;
  email?: string | null;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const ENV_RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID;

function parseGlobalAdminEmails(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

const GLOBAL_ADMIN_EMAILS = parseGlobalAdminEmails(
  process.env.DASHBOARD_GLOBAL_ADMIN_EMAILS
);

/**
 * Resolves the current staff context from the request.
 * Requires Authorization: Bearer <token>. Validates via Supabase and loads restaurant_staff (role, restaurant_id).
 * Without a valid token returns null (unauthorized) — no fallback so the dashboard always shows login when not logged in.
 */
export async function getStaffFromRequest(req: NextRequest): Promise<StaffContext | null> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  try {
    const supabase = token
      ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: { persistSession: false },
        })
      : createSupabaseServerClient();
    const { data: { user }, error: userError } = token
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser();
    if (userError || !user?.id) {
      if (process.env.NODE_ENV === "development") {
        console.log(
          "[auth-dashboard] getUser failed:",
          userError?.message ?? "no user"
        );
      }
      return null;
    }

    // Admin global (por email) — puede entrar aunque no exista en restaurant_staff.
    // En este proyecto el panel se considera single-tenant por env, así que el contexto
    // de restaurante es el de NEXT_PUBLIC_RESTAURANT_ID.
    const userEmail = (user.email ?? "").trim().toLowerCase();
    if (userEmail && GLOBAL_ADMIN_EMAILS.includes(userEmail)) {
      if (!ENV_RESTAURANT_ID) return null;
      return {
        restaurantId: ENV_RESTAURANT_ID,
        role: "admin",
        userId: user.id,
        name: user.email ?? "Admin",
        email: user.email ?? null,
      };
    }

    // Single-tenant: el usuario debe pertenecer al restaurante de este deploy.
    if (!ENV_RESTAURANT_ID) return null;

    const { data: staffRow } = await supabaseAdmin
      .from("restaurant_staff")
      .select("restaurant_id, role, name")
      .eq("user_id", user.id)
      .eq("restaurant_id", ENV_RESTAURANT_ID)
      .limit(1)
      .maybeSingle();

    if (!staffRow?.restaurant_id) {
      if (process.env.NODE_ENV === "development") {
        console.log("[auth-dashboard] User not in restaurant_staff:", user.id);
      }
      return null;
    }

    const role = (staffRow?.role as DashboardRole) ?? "staff";

    return {
      restaurantId: staffRow.restaurant_id,
      role: role as DashboardRole,
      userId: user.id,
      name: staffRow.name ?? undefined,
      email: user.email ?? null,
    };
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.log("[auth-dashboard] Error:", e);
    }
    return null;
  }
}

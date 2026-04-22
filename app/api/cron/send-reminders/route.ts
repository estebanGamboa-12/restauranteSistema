"use server";

import { NextResponse } from "next/server";

/**
 * Los recordatorios automáticos por email están DESACTIVADOS por política.
 * Los recordatorios se envían de forma manual por WhatsApp desde el dashboard
 * usando las plantillas editables (ver /dashboard/templates y /dashboard/reservations).
 *
 * Este endpoint se mantiene como no-op para no romper crons existentes.
 */
export async function GET() {
  return NextResponse.json({ sent: 0, disabled: true });
}

export async function POST() {
  return NextResponse.json({ sent: 0, disabled: true });
}

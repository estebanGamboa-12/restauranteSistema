import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase para ejecutar en servidor (Route Handlers, Server Components,
 * Server Actions). Usa las cookies del request para autenticar.
 *
 * Nota: en algunos Server Components la escritura de cookies puede lanzar un error
 * (solo se permite en Route Handlers / Server Actions). Lo envolvemos en try/catch
 * para que el uso "read-only" no rompa.
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            /* noop en Server Components read-only */
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            /* noop */
          }
        },
      },
    }
  );
}

/**
 * Crea (o confirma) un usuario en Supabase usando el Service Role.
 * - Salta la confirmación de email (email_confirm: true).
 * - Si el email ya existe, actualiza la contraseña y lo deja confirmado.
 *
 * Uso (Node 20.6+):
 *   node --env-file=.env scripts/create-admin-user.mjs <email> <password> [nombre]
 * Ejemplo:
 *   node --env-file=.env scripts/create-admin-user.mjs estebitangb12@gmail.com 123123 Esteban
 *
 * Nota: para que ese usuario sea ADMIN del dashboard, su email debe estar en
 * la env DASHBOARD_GLOBAL_ADMIN_EMAILS (separado por comas si hay varios).
 */

import { createClient } from "@supabase/supabase-js";

const [, , emailArg, passwordArg, ...rest] = process.argv;
const email = (emailArg ?? "").trim().toLowerCase();
const password = passwordArg ?? "";
const fullName = rest.join(" ").trim() || null;

if (!email || !password) {
  console.error(
    "Uso: node scripts/create-admin-user.mjs <email> <password> [nombre]"
  );
  process.exit(1);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env"
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function buscarExistente() {
  // listUsers pagina; con el email solemos tener pocos resultados.
  return admin.auth.admin.listUsers({ page: 1, perPage: 200 });
}

const { data: lista, error: errorLista } = await buscarExistente();
if (errorLista) {
  console.error("Error listando usuarios:", errorLista.message);
  process.exit(1);
}

const existente = lista?.users?.find(
  (u) => (u.email ?? "").toLowerCase() === email
);

if (existente) {
  const { error } = await admin.auth.admin.updateUserById(existente.id, {
    password,
    email_confirm: true,
    user_metadata: {
      ...(existente.user_metadata ?? {}),
      ...(fullName ? { full_name: fullName, name: fullName } : {}),
    },
  });
  if (error) {
    console.error("Error actualizando usuario:", error.message);
    process.exit(1);
  }
  console.log(`OK — usuario actualizado y confirmado: ${email}`);
  console.log(`    id: ${existente.id}`);
} else {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName, name: fullName } : {},
  });
  if (error) {
    console.error("Error creando usuario:", error.message);
    process.exit(1);
  }
  console.log(`OK — usuario creado y confirmado: ${email}`);
  console.log(`    id: ${data.user?.id}`);
}

const adminEmails = (process.env.DASHBOARD_GLOBAL_ADMIN_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

if (adminEmails.includes(email)) {
  console.log("Ese email está en DASHBOARD_GLOBAL_ADMIN_EMAILS → entra como admin.");
} else {
  console.log(
    "Aviso: ese email NO está en DASHBOARD_GLOBAL_ADMIN_EMAILS; será cliente normal."
  );
}

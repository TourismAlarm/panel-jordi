import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./tipos";

// SOLO para crons y automatizaciones del servidor. Salta RLS: filtrar siempre por user_id.
export function supabaseAdmin() {
  const limpio = (v: string | undefined) => v?.trim().replace(/^["']|["']$/g, "").trim();
  const url = limpio(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const clave = limpio(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!url || !clave) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  return createClient<Database>(url, clave, { auth: { persistSession: false, autoRefreshToken: false } });
}

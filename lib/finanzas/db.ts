import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente del servidor para Finanzas (service_role). Salta RLS: toda consulta debe filtrar por user_id,
// igual que en la app original. Los nombres de tabla del código original (transactions, accounts…) se
// traducen aquí a su versión con prefijo (fin_transactions, fin_accounts…).
let cliente: SupabaseClient | null = null;

function admin(): SupabaseClient {
  if (!cliente) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !clave) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
    cliente = createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return cliente;
}

export const supabaseAdmin = {
  from: (tabla: string) => admin().from(`fin_${tabla}`),
};

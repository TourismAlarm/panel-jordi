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

// Si faltan las variables, las consultas no revientan con un 500 vacío: devuelven un error normal que la
// pantalla enseña tal cual («Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY»).
function consultaConError(mensaje: string): any {
  const resultado = { data: null, count: null, error: { message: mensaje } };
  const proxy: any = new Proxy(function () {}, {
    get: (_o, prop) => (prop === 'then' ? (ok: (v: unknown) => unknown) => Promise.resolve(resultado).then(ok) : () => proxy),
    apply: () => proxy,
  });
  return proxy;
}

export const supabaseAdmin = {
  from: (tabla: string): ReturnType<SupabaseClient['from']> => {
    try {
      return admin().from(`fin_${tabla}`);
    } catch (e) {
      return consultaConError(e instanceof Error ? e.message : 'Supabase no está configurado');
    }
  },
};

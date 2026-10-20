import { createBrowserClient } from "@supabase/ssr";
import { configSupabase } from "./config";
import type { Database } from "./tipos";

// Cliente del navegador (clave publicable + sesión; RLS manda).
export function supabaseNavegador() {
  const { url, clave } = configSupabase();
  return createBrowserClient<Database>(url, clave);
}

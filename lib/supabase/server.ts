import "server-only";
import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { configSupabase } from "./config";
import type { Database } from "./tipos";

// Cliente con la sesión de Jordi (clave pública + RLS). Uno por petición gracias a cache().
export const supabaseServidor = cache(async () => {
  const cookieStore = await cookies();
  const { url, clave } = configSupabase();
  return createServerClient<Database>(url, clave, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(lista) {
        try {
          lista.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Desde un Server Component no se pueden escribir cookies; el proxy ya refresca la sesión.
        }
      },
    },
  });
});

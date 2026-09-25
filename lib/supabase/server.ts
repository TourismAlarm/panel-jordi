import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cliente con la sesión de Jordi (clave pública + RLS). Nunca la service_role.
export async function supabaseServidor() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
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
    },
  );
}

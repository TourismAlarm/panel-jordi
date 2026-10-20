import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { correoPermitido } from "@/lib/acceso";
import { configSupabase } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/tipos";

// Refresca la sesión en cada petición. Sin sesión → /login. Con sesión de otro correo → /acceso-denegado.
// /api/cron/* no usa sesión: cada ruta valida CRON_SECRET (lib/cron-auth.ts).
const PUBLICAS = ["/login", "/auth/callback", "/acceso-denegado", "/api/cron/"];

export async function proxy(request: NextRequest) {
  const ruta = request.nextUrl.pathname;
  if (ruta.startsWith("/api/cron/")) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const { url, clave } = configSupabase();

  const supabase = createServerClient<Database>(url, clave, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(lista) {
        lista.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        lista.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email as string | undefined;
  const publica = PUBLICAS.some((p) => ruta.startsWith(p));

  if (!data?.claims) {
    return publica ? response : NextResponse.redirect(new URL("/login", request.url));
  }
  if (!correoPermitido(email)) {
    return ruta.startsWith("/acceso-denegado") ? response : NextResponse.redirect(new URL("/acceso-denegado", request.url));
  }
  if (ruta.startsWith("/login") || ruta.startsWith("/acceso-denegado")) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.png$).*)"],
};

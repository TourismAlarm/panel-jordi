import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { configSupabase } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/tipos";

// Refresca la sesión en cada petición y manda a /login a quien no la tenga.
export async function proxy(request: NextRequest) {
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
  const enLogin = request.nextUrl.pathname.startsWith("/login");

  if (!data?.claims && !enLogin) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (data?.claims && enLogin) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.png$).*)"],
};

import { NextResponse, type NextRequest } from "next/server";
import { correoPermitido } from "@/lib/acceso";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServidor } from "@/lib/supabase/server";

// Vuelta de Google: cambia el código por sesión y comprueba que el correo es el permitido.
export async function GET(request: NextRequest) {
  const origen = request.nextUrl.origin;
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(`${origen}/login?error=google`);

  const supabase = await supabaseServidor();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${origen}/login?error=google`);

  const { data } = await supabase.auth.getUser();
  if (!correoPermitido(data.user?.email)) {
    await supabase.auth.signOut();
    // Cualquier otro correo no debe quedar registrado en auth.users.
    if (data.user && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        await supabaseAdmin().auth.admin.deleteUser(data.user.id);
      } catch {
        // si falla, RLS ya le impide ver nada
      }
    }
    return NextResponse.redirect(`${origen}/acceso-denegado`);
  }
  return NextResponse.redirect(`${origen}/`);
}

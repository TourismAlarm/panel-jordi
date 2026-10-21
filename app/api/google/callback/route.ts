import { NextResponse, type NextRequest } from "next/server";
import { correoPermitido } from "@/lib/acceso";
import { conectarConCodigo, urlRedireccion } from "@/lib/google/cliente";
import { supabaseServidor } from "@/lib/supabase/server";

// Google vuelve aquí con un código. Se comprueba el «state» (anti-CSRF) y la sesión, y se guarda el token cifrado.
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const volver = (r: string) => {
    const res = NextResponse.redirect(new URL(`/ajustes?google=${r}`, request.url));
    res.cookies.delete({ name: "google_estado", path: "/api/google" });
    return res;
  };
  const supabase = await supabaseServidor();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId || !correoPermitido(data?.claims?.email as string | undefined)) return NextResponse.json({ error: "no autorizado" }, { status: 401 });

  const esperado = request.cookies.get("google_estado")?.value;
  const codigo = url.searchParams.get("code");
  if (url.searchParams.get("error")) return volver("cancelado");
  if (!codigo || !esperado || url.searchParams.get("state") !== esperado) return volver("estado-invalido");

  try {
    await conectarConCodigo(userId, codigo, urlRedireccion(url.origin));
    return volver("ok");
  } catch (e) {
    console.error("Google · conectar:", e instanceof Error ? e.message : e);
    return volver("error");
  }
}

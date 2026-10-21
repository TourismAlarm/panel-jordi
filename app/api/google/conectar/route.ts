import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { googleConfigurado, urlAutorizacion, urlRedireccion } from "@/lib/google/cliente";
import { supabaseServidor } from "@/lib/supabase/server";
import { correoPermitido } from "@/lib/acceso";

// Empieza la conexión con Google (Gmail + Calendar, solo lectura). Exige sesión: el proxy ya la pide,
// y aquí se comprueba además que el correo sea el permitido.
export async function GET(request: NextRequest) {
  const supabase = await supabaseServidor();
  const { data } = await supabase.auth.getClaims();
  if (!correoPermitido(data?.claims?.email as string | undefined)) return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  if (!googleConfigurado()) return NextResponse.redirect(new URL("/ajustes?google=sin-configurar", request.url));

  const estado = randomBytes(24).toString("hex");
  const destino = urlAutorizacion(estado, urlRedireccion(request.nextUrl.origin));
  const respuesta = NextResponse.redirect(destino);
  respuesta.cookies.set("google_estado", estado, { httpOnly: true, secure: true, sameSite: "lax", path: "/api/google", maxAge: 600 });
  return respuesta;
}

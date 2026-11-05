import { NextResponse } from "next/server";
import { conBot, firmanteDeUrl } from "@/lib/bots/entrada";
import { senalesParaDia } from "@/lib/bots/vida";
import { duenoId } from "@/lib/datos/dueno";
import { aISODia } from "@/lib/fechas";
import { reunirHoy } from "@/lib/hoy/reunir";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/bots/hoy/datos — lo mismo que reúne la pantalla de Hoy, sin agenda ni correo, sin texto de documentos y sin valores de salud.
export async function GET(request: Request) {
  return conBot(request, "hoy:leer", async (clave) => {
    const firma = firmanteDeUrl(request, clave, "hoy:leer");
    if ("fallo" in firma) return firma.fallo;
    const fecha = new URL(request.url).searchParams.get("fecha");
    if (fecha && fecha !== aISODia()) return NextResponse.json({ error: "solo se reúne el día de hoy" }, { status: 400 });
    const foto = await reunirHoy(supabaseAdmin(), await duenoId(), { conGoogle: false, soloLectura: true });
    return NextResponse.json({ fecha: foto.fecha, senales: senalesParaDia(foto.senales), fallos: foto.fallos });
  });
}

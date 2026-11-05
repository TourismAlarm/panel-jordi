import { NextRequest, NextResponse } from "next/server";
import { cronNoAutorizado } from "@/lib/cron-auth";
import { enviarAviso } from "@/lib/bots/aviso";
import { generarResumen } from "@/lib/hoy/generar";

export const maxDuration = 120;

// GET /api/cron/resumen-diario — lo llama el cron de Vercel cada mañana (ver README: hora y verano/invierno).
// Deja el resumen sencillo de hoy (sin correo) y avisa a Antonio para que el bot Día escriba el suyo. No se registra el contenido, solo el resultado.
export async function GET(request: NextRequest) {
  const denegado = cronNoAutorizado(request);
  if (denegado) return denegado;
  try {
    const r = await generarResumen();
    console.log("☀️ Resumen diario:", JSON.stringify({ fecha: r.fecha, fallos: r.fallos, yaExistia: r.yaExistia }));
    await enviarAviso({ evento: "dia", fecha: r.fecha });
    return NextResponse.json(r);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error generando el resumen";
    console.error("❌ cron resumen-diario:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

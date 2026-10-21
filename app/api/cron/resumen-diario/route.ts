import { NextRequest, NextResponse } from "next/server";
import { cronNoAutorizado } from "@/lib/cron-auth";
import { generarYEnviarResumen } from "@/lib/hoy/enviar";

export const maxDuration = 120;

// GET /api/cron/resumen-diario — lo llama el cron de Vercel cada mañana (ver README: hora y verano/invierno).
// Una vez al día: si ya se envió hoy no vuelve a enviar. No se registra el contenido, solo el resultado.
export async function GET(request: NextRequest) {
  const denegado = cronNoAutorizado(request);
  if (denegado) return denegado;
  try {
    const r = await generarYEnviarResumen();
    console.log("☀️ Resumen diario:", JSON.stringify({ estado: r.estado, conIA: r.conIA, fallos: r.fallos, errorCorreo: r.errorCorreo }));
    return NextResponse.json(r);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error generando el resumen";
    console.error("❌ cron resumen-diario:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

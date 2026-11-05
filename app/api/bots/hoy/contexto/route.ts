import { NextResponse } from "next/server";
import { conBot, firmante, leerCuerpo } from "@/lib/bots/entrada";
import { ContextoHoyIn } from "@/lib/bots/esquemas";
import { duenoId } from "@/lib/datos/dueno";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/tipos";

// POST /api/bots/hoy/contexto — Antonio publica la agenda y/o la selección de correo de un día (firma `dia`).
// Bloque ausente: no se toca. []: revisado y vacío. No toca el resumen.
export async function POST(request: Request) {
  return conBot(request, "hoy:escribir", async (clave) => {
    const cuerpo = await leerCuerpo(request, ContextoHoyIn);
    if ("fallo" in cuerpo) return cuerpo.fallo;
    const { bot, fecha, agenda, correos } = cuerpo.datos;
    const firma = firmante(clave, bot, "hoy:escribir");
    if ("fallo" in firma) return firma.fallo;
    const { error } = await supabaseAdmin().rpc("hoy_publicar_contexto", {
      p_user: await duenoId(),
      p_fecha: fecha,
      // null = ese bloque no viene; el tipo generado no admite null, pero la función sí.
      p_agenda: (agenda ?? null) as Json,
      p_correos: (correos ?? null) as Json,
    });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true }, { status: 201 });
  });
}

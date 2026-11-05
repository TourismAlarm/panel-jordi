import { NextResponse } from "next/server";
import { conBot, firmante, leerCuerpo } from "@/lib/bots/entrada";
import { ResumenHoyIn } from "@/lib/bots/esquemas";
import { duenoId } from "@/lib/datos/dueno";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/tipos";

// POST /api/bots/hoy/resumen — el resumen de Día, que publica Antonio. Sustituye al del cron de ese día. No toca agenda, correo ni enviado_en; sin `senales`, las anteriores se quedan.
export async function POST(request: Request) {
  return conBot(request, "hoy:escribir", async (clave) => {
    const cuerpo = await leerCuerpo(request, ResumenHoyIn);
    if ("fallo" in cuerpo) return cuerpo.fallo;
    const { bot, fecha, resumen, prioridades, senales } = cuerpo.datos;
    const firma = firmante(clave, bot, "hoy:escribir");
    if ("fallo" in firma) return firma.fallo;
    const { error } = await supabaseAdmin()
      .from("resumenes_diarios")
      .upsert(
        { user_id: await duenoId(), fecha, resumen, prioridades: prioridades as Json, ...(senales === undefined ? {} : { senales: senales as Json }), origen: "bot", generado_en: new Date().toISOString() },
        { onConflict: "user_id,fecha" },
      );
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true }, { status: 201 });
  });
}

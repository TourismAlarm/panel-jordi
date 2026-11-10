import { NextResponse } from "next/server";
import { leerArnes } from "@/lib/arnes/leer";
import { conBot } from "@/lib/bots/entrada";
import { duenoId } from "@/lib/datos/dueno";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/bots/arnes — todo junto: tareas a medias, pendientes por agente, rutinas y memoria común.
// Antonio lo lee al arrancar cada turno o rutina. Los enlaces del panel salen completos para poder abrirlos.
export async function GET(request: Request) {
  return conBot(request, "arnes:leer", async () => {
    const arnes = await leerArnes(supabaseAdmin(), await duenoId());
    const origen = new URL(request.url).origin;
    const completo = (e: string | null) => (e?.startsWith("/") ? `${origen}${e}` : e);
    return NextResponse.json({
      ...arnes,
      tareas: arnes.tareas.map((t) => ({ ...t, enlace: completo(t.enlace) })),
      por_agente: arnes.por_agente.map((g) => ({ ...g, pendientes: g.pendientes.map((p) => ({ ...p, enlace: completo(p.enlace) })) })),
    });
  });
}

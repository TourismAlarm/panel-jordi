import { NextResponse } from "next/server";
import { leerArnes } from "@/lib/arnes/leer";
import { conBot } from "@/lib/bots/entrada";
import { agruparRechazos, type Llamada } from "@/lib/bots/rechazos";
import { duenoId } from "@/lib/datos/dueno";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/bots/arnes — todo junto: tareas a medias, pendientes por agente, rutinas y memoria común.
// Antonio lo lee al arrancar cada turno o rutina. Incluye lo que el panel le ha rechazado en 24 h y por qué.
// Los enlaces del panel salen completos para poder abrirlos.
export async function GET(request: Request) {
  return conBot(request, "arnes:leer", async () => {
    const db = supabaseAdmin();
    const [arnes, llamadas] = await Promise.all([
      leerArnes(db, await duenoId()),
      // Lo que el panel ha rechazado en las últimas 24 h, para que no se repita. Si no se puede leer, el arnés sale igual.
      db.from("bots_llamadas").select("*").gte("estado", 400).gte("creado", new Date(Date.now() - 86_400_000).toISOString()).order("creado", { ascending: false }).limit(500),
    ]);
    if (llamadas.error) console.error("Arnés · rechazos:", llamadas.error.message);
    const rechazos = agruparRechazos(((llamadas.data ?? []) as unknown as (Llamada & { detalle?: string | null })[]).map((l) => ({ ...l, detalle: l.detalle ?? null })));
    const origen = new URL(request.url).origin;
    const completo = (e: string | null) => (e?.startsWith("/") ? `${origen}${e}` : e);
    return NextResponse.json({
      ...arnes,
      rechazos_recientes: rechazos,
      tareas: arnes.tareas.map((t) => ({ ...t, enlace: completo(t.enlace) })),
      por_agente: arnes.por_agente.map((g) => ({ ...g, pendientes: g.pendientes.map((p) => ({ ...p, enlace: completo(p.enlace) })) })),
    });
  });
}

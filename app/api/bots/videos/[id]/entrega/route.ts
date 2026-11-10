import { NextResponse } from "next/server";
import { avisarAntonio } from "@/lib/bots/aviso";
import { conBot, conDatosDeCliente, leerCuerpo } from "@/lib/bots/entrada";
import { EntregaIn } from "@/lib/bots/esquemas";
import { falloDeRegla } from "@/lib/bots/reglas";
import { supabaseAdmin } from "@/lib/supabase/admin";

// POST /api/bots/videos/{id}/entrega — un montaje hecho fuera de la cola del PC (el Editor con Claude Code).
// Una sola escritura: crea el encargo «listo», sustituye lo abierto del vídeo y lo pone en «Te toca revisar» con el enlace.
// Lo demás (ficha, ELSA, arnés, portada) lo recalcula el panel. La misma `version` otra vez actualiza, no duplica.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return conBot(request, "edicion:entregar", async (clave) => {
    const { id } = await params;
    if (!/^GE_\d{3,}$/.test(id)) return NextResponse.json({ error: "id no válido" }, { status: 400 });
    const cuerpo = await leerCuerpo(request, EntregaIn);
    if ("fallo" in cuerpo) return cuerpo.fallo;
    const d = cuerpo.datos;
    const conDatos = conDatosDeCliente({ notas: d.notas ?? "" });
    if (conDatos) return conDatos;

    const db = supabaseAdmin();
    const { data, error } = await db.rpc("entregar_montaje", {
      p_video: id,
      p_fase: d.fase,
      p_version: d.version,
      p_url: d.resultado_url,
      p_duracion: d.duracion_real_s,
      p_notas: (d.notas ?? null) as string,
      p_quien: d.hecho_por,
    });
    if (error) return falloDeRegla(error);
    const e = data as { id: string; version: number; nuevo: boolean };

    const ahora = new Date().toISOString();
    const { error: eActividad } = await db.from("actividad_bots").insert({
      bot: "editor",
      tarea: `Montaje entregado ${id} ${d.version}`,
      inicio: ahora,
      fin: ahora,
      resultado: "ok",
      nota: `${d.fase} · ${d.duracion_real_s} s · ${d.hecho_por}${d.notas ? ` · ${d.notas}` : ""}`.slice(0, 2000),
      enlace: d.resultado_url,
    });
    if (eActividad) console.error("Bots · actividad de la entrega:", eActividad.message);
    // Si lo sube el Editor con su llave, Antonio se entera igual que con el PC. Si lo sube Antonio, ya lo sabe.
    if (clave !== "antonio") avisarAntonio({ evento: "edicion_lista", encargo_id: e.id, video_id: id, version: e.version, estado: "listo" });

    return NextResponse.json({ ok: true, ...e }, { status: e.nuevo ? 201 : 200 });
  });
}

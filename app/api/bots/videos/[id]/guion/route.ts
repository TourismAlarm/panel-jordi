import { NextResponse } from "next/server";
import { conBot, conDatosDeCliente, firmante, leerCuerpo } from "@/lib/bots/entrada";
import { VideoGuionIn } from "@/lib/bots/esquemas";
import { guionConCuerpoNuevo, porQueNoSeEditaElGuion } from "@/lib/bots/guiones";
import { supabaseAdmin } from "@/lib/supabase/admin";

const noVale = (error: string, status = 409) => NextResponse.json({ error }, { status });

// POST /api/bots/videos/GE_044/guion — mete las respuestas de Jordi en el guion de un vídeo del panel y/o da esas respuestas por recogidas.
// El guion anterior se queda en videos_guion_historial. En cuanto el material está entregado, el guion ya no se toca.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return conBot(request, "guiones:escribir", async (clave) => {
    const { id } = await params;
    if (!/^GE_\d{3,}$/.test(id)) return noVale("id no válido", 400);
    const cuerpo = await leerCuerpo(request, VideoGuionIn);
    if ("fallo" in cuerpo) return cuerpo.fallo;
    const { bot, guion_md, recogidas } = cuerpo.datos;
    const firma = firmante(clave, bot ?? "guionista", "guiones:escribir");
    if ("fallo" in firma) return firma.fallo;
    const conDatos = conDatosDeCliente({ guion_md });
    if (conDatos) return conDatos;

    const db = supabaseAdmin();
    const { data: video, error } = await db.from("videos").select("origen, estado, guion_md").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!video) return noVale("ese vídeo no existe", 404);
    const { count, error: eMaterial } = await db.from("peticiones").select("id", { count: "exact", head: true }).eq("video_id", id).eq("tipo", "material_listo").neq("estado", "fallida");
    if (eMaterial) throw new Error(eMaterial.message);
    const motivo = porQueNoSeEditaElGuion(video, (count ?? 0) > 0);
    if (motivo) return noVale(motivo);

    let version: number | null = null;
    if (guion_md) {
      const nuevo = guionConCuerpoNuevo(video.guion_md, guion_md);
      if (!nuevo) return noVale("este vídeo no tiene guion que actualizar");
      const { error: eHistorial } = await db.from("videos_guion_historial").insert({ video_id: id, guion_md: video.guion_md as string, quien: firma.autor });
      if (eHistorial) throw new Error(eHistorial.message);
      const { error: eGuion } = await db.from("videos").update({ guion_md: nuevo.md, actualizado_en: new Date().toISOString() }).eq("id", id);
      if (eGuion) throw new Error(eGuion.message);
      version = nuevo.version;
    }

    // Solo se recoge la respuesta que Antonio leyó: si Jordi la ha cambiado después, sigue pendiente.
    const hechas: string[] = [];
    for (const r of recogidas) {
      const { data, error: eRecoger } = await db
        .from("preguntas")
        .update({ recogida_en: new Date().toISOString() })
        .eq("video_id", id)
        .eq("clave", r.clave)
        .eq("respondida_en", r.respondida_en)
        .is("recogida_en", null)
        .select("clave");
      if (eRecoger) throw new Error(eRecoger.message);
      if (data.length) hechas.push(r.clave);
    }
    return NextResponse.json({ ok: true, version, recogidas: hechas, sin_recoger: recogidas.map((r) => r.clave).filter((c) => !hechas.includes(c)) });
  });
}

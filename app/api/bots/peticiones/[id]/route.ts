import { NextResponse } from "next/server";
import { conBot, leerCuerpo } from "@/lib/bots/entrada";
import { PeticionCambioIn } from "@/lib/bots/esquemas";
import { supabaseAdmin } from "@/lib/supabase/admin";

// POST /api/bots/peticiones/{id} — Antonio dice en qué punto está. Desde que la toca, Jordi ya no la puede deshacer.
// Un descarte hecho archiva el vídeo: sale de la portada y la cola de edición ya no lo acepta.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return conBot(request, "peticiones:escribir", async () => {
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "id no válido" }, { status: 400 });
    const cuerpo = await leerCuerpo(request, PeticionCambioIn);
    if ("fallo" in cuerpo) return cuerpo.fallo;
    const cambio = cuerpo.datos;

    const db = supabaseAdmin();
    const { data: p, error } = await db.from("peticiones").select("tipo, video_id, estado, recogida_en").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!p) return NextResponse.json({ error: "esa petición no existe o Jordi la ha deshecho" }, { status: 404 });
    if (p.estado === "hecha" || p.estado === "fallida") return NextResponse.json({ error: `esa petición ya está ${p.estado}` }, { status: 409 });

    const ahora = new Date().toISOString();
    const { data, error: eCambio } = await db
      .from("peticiones")
      .update({
        estado: cambio.estado,
        error: cambio.estado === "fallida" ? cambio.error : null,
        procesada_en: cambio.estado === "procesando" ? null : ahora,
        recogida_en: p.recogida_en ?? ahora,
      })
      .eq("id", id)
      .eq("estado", p.estado)
      .select("id");
    if (eCambio) throw new Error(eCambio.message);
    if (!data.length) return NextResponse.json({ error: "esa petición ha cambiado mientras tanto" }, { status: 409 });

    if (cambio.estado === "hecha" && p.tipo === "descartar" && p.video_id) {
      const { error: eVideo } = await db.from("videos").update({ estado: "archivado", por_revisar: false, siguiente_paso: "Descartado por Jordi", actualizado_en: ahora }).eq("id", p.video_id);
      if (eVideo) throw new Error(eVideo.message);
    }
    return NextResponse.json({ ok: true });
  });
}

import { NextResponse } from "next/server";
import { conBot, leerCuerpo } from "@/lib/bots/entrada";
import { PublicacionesIn } from "@/lib/bots/esquemas";
import { supabaseAdmin } from "@/lib/supabase/admin";

// POST /api/bots/publicaciones — cuándo sale (o salió) cada vídeo en cada red. Una fila por vídeo y red: la misma
// pareja la sustituye entera. Es lo que pinta la tarjeta «Para publicar» de Proyectos.
export async function POST(request: Request) {
  return conBot(request, "publicaciones:escribir", async (bot) => {
    const cuerpo = await leerCuerpo(request, PublicacionesIn);
    if ("fallo" in cuerpo) return cuerpo.fallo;
    const db = supabaseAdmin();

    const ids = [...new Set(cuerpo.datos.items.map((p) => p.video_id))];
    const { data: hay, error: eVideos } = await db.from("videos").select("id").in("id", ids);
    if (eVideos) throw new Error(eVideos.message);
    const faltan = ids.filter((id) => !hay.some((v) => v.id === id));
    if (faltan.length) return NextResponse.json({ error: "ese vídeo no existe", detalle: faltan }, { status: 404 });

    const ahora = new Date().toISOString();
    const filas = cuerpo.datos.items.map((p) => ({
      video_id: p.video_id,
      red: p.red,
      estado: p.estado,
      fecha: p.fecha ? new Date(p.fecha).toISOString() : null,
      enlace: p.enlace ?? null,
      creado_por: bot,
      actualizado_en: ahora,
    }));
    const { error } = await db.from("publicaciones").upsert(filas, { onConflict: "video_id,red" });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, publicaciones: filas.length }, { status: 201 });
  });
}

// GET /api/bots/publicaciones — todas, por fecha (las que no tienen, al final).
export async function GET(request: Request) {
  return conBot(request, "publicaciones:leer", async () => {
    const { data, error } = await supabaseAdmin()
      .from("publicaciones")
      .select("video_id, red, fecha, estado, enlace, actualizado_en")
      .order("fecha", { ascending: true, nullsFirst: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return NextResponse.json({ items: data });
  });
}

import { NextResponse } from "next/server";
import { textosDeEncargo } from "@/lib/bots/edicion";
import { conBot, conDatosDeCliente, leerCuerpo, leerFiltro } from "@/lib/bots/entrada";
import { EncargoIn, FiltroEncargo } from "@/lib/bots/esquemas";
import { guionParaBot } from "@/lib/bots/limpieza";
import { falloDeRegla } from "@/lib/bots/reglas";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/tipos";

// POST /api/bots/edicion — Antonio encarga un montaje, o su versión siguiente con reemplaza_id. El vídeo pasa a «montando».
export async function POST(request: Request) {
  return conBot(request, "edicion:escribir", async () => {
    const cuerpo = await leerCuerpo(request, EncargoIn);
    if ("fallo" in cuerpo) return cuerpo.fallo;
    const conDatos = conDatosDeCliente(textosDeEncargo(cuerpo.datos));
    if (conDatos) return conDatos;

    const { video_id, fase, reemplaza_id, feedback, brutos, guion_md, instrucciones } = cuerpo.datos;
    const db = supabaseAdmin();
    // Sin guion propio va el del vídeo, sin cabecera y con lo reconocible tachado.
    let guion = guion_md ?? null;
    if (!guion) {
      const { data, error } = await db.from("videos").select("guion_md").eq("id", video_id).maybeSingle();
      if (error) throw new Error(error.message);
      guion = guionParaBot(data?.guion_md ?? null);
    }
    const { data, error } = await db.rpc("crear_encargo", {
      p_video: video_id,
      p_reemplaza: (reemplaza_id ?? null) as string, // el tipo generado no admite null, pero sin este dato Supabase no encuentra la función
      p_fase: fase,
      p_brutos: brutos,
      p_guion_md: guion ?? "",
      p_instrucciones: instrucciones as Json,
      p_feedback: feedback ?? "",
      p_quien: "antonio",
    });
    if (error) return falloDeRegla(error);
    return NextResponse.json({ ok: true, ...(data as { id: string; version: number }) }, { status: 201 });
  });
}

// GET /api/bots/edicion?estado=listo&video_id=GE_044 — con «listo», solo lo que Antonio aún no ha revisado.
export async function GET(request: Request) {
  return conBot(request, "edicion:leer", async () => {
    const estado = leerFiltro(request, "estado", FiltroEncargo);
    if ("fallo" in estado) return estado.fallo;
    const videoId = new URL(request.url).searchParams.get("video_id");
    if (videoId !== null && !/^GE_\d{3,}$/.test(videoId)) return NextResponse.json({ error: "video_id no válido" }, { status: 400 });

    let consulta = supabaseAdmin()
      .from("encargos_edicion")
      .select("id, video_id, version, reemplaza_id, fase, estado, resultado_url, resultado_notas, preguntas, duracion_real_s, final_url, revisado_en, decision_jordi, creado, tomado_en, terminado_en, error")
      .order("creado", { ascending: false })
      .limit(100);
    if (estado.valor) consulta = consulta.eq("estado", estado.valor);
    if (estado.valor === "listo") consulta = consulta.is("revisado_en", null);
    if (videoId) consulta = consulta.eq("video_id", videoId);
    const { data, error } = await consulta;
    if (error) throw new Error(error.message);
    return NextResponse.json({ items: data });
  });
}

import { NextResponse } from "next/server";
import { conBot } from "@/lib/bots/entrada";
import { tacharDatos } from "@/lib/bots/limpieza";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/bots/preguntas — lo que Jordi ha contestado y nadie ha recogido. Con ?video_id=GE_044, todas las de ese vídeo.
// También las de vídeos que creó el PC: el PC ya no recoge nada.
export async function GET(request: Request) {
  return conBot(request, "videos:leer", async () => {
    const videoId = new URL(request.url).searchParams.get("video_id");
    if (videoId !== null && !/^GE_\d{3,}$/.test(videoId)) return NextResponse.json({ error: "video_id no válido" }, { status: 400 });

    let consulta = supabaseAdmin()
      .from("preguntas")
      .select("video_id, clave, texto, respuesta, respondida_en, recogida_en")
      .order("video_id")
      .order("orden")
      .limit(200);
    consulta = videoId ? consulta.eq("video_id", videoId) : consulta.not("respondida_en", "is", null).is("recogida_en", null);
    const { data, error } = await consulta;
    if (error) throw new Error(error.message);
    const items = data.map(({ texto, respuesta, ...p }) => ({ ...p, texto: tacharDatos(texto), respuesta: respuesta === null ? null : tacharDatos(respuesta) }));
    return NextResponse.json({ items });
  });
}

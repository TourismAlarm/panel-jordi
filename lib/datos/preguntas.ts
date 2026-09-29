import "server-only";
import { cache } from "react";
import { supabaseServidor } from "@/lib/supabase/server";
import type { Fila } from "@/lib/supabase/tipos";
import { comprobar } from "./comun";

export type Pregunta = Fila<"preguntas">;

// Las que aún no has contestado, agrupables por vídeo.
export const preguntasPendientes = cache(async () => {
  const supabase = await supabaseServidor();
  const r = await supabase
    .from("preguntas")
    .select("id, video_id, clave, orden, texto")
    .is("respondida_en", null)
    .order("video_id")
    .order("orden");
  return comprobar(r, "las preguntas");
});

export const preguntasDeVideo = cache(async (videoId: string): Promise<Pregunta[]> => {
  const supabase = await supabaseServidor();
  const r = await supabase.from("preguntas").select("*").eq("video_id", videoId).order("orden");
  return comprobar(r, "las preguntas del vídeo");
});

// Contestadas desde el móvil que el PC aún no ha recogido.
export const contarEnviadas = cache(async () => {
  const supabase = await supabaseServidor();
  const r = await supabase
    .from("preguntas")
    .select("id", { count: "exact", head: true })
    .not("respondida_en", "is", null)
    .is("recogida_en", null);
  if (r.error) throw new Error("No se han podido contar las respuestas enviadas.");
  return r.count ?? 0;
});

// Lo único que la app escribe. RLS solo deja si eres usuario permitido y el PC aún no la ha recogido.
export async function guardarRespuesta(id: string, respuesta: string): Promise<"ok" | "recogida" | "error"> {
  const supabase = await supabaseServidor();
  const { data, error } = await supabase
    .from("preguntas")
    .update({ respuesta, respondida_en: new Date().toISOString() })
    .eq("id", id)
    .select("id");
  if (error) return "error";
  if (!data?.length) return "recogida";
  return "ok";
}

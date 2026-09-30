import "server-only";
import { cache } from "react";
import { supabaseServidor } from "@/lib/supabase/server";
import type { Fila } from "@/lib/supabase/tipos";
import { comprobar } from "./comun";

export type Pregunta = Fila<"preguntas">;

export const preguntasDeVideo = cache(async (videoId: string): Promise<Pregunta[]> => {
  const supabase = await supabaseServidor();
  const r = await supabase.from("preguntas").select("*").eq("video_id", videoId).order("orden");
  return comprobar(r, "las preguntas del vídeo");
});

export type ResumenPreguntas = { total: number; sinContestar: number; enviadas: number };

type EstadoFila = Pick<Pregunta, "respondida_en" | "recogida_en">;

// Cuántas preguntas hay, cuántas faltan por contestar y cuántas esperan a que el PC las recoja.
export function resumir(filas: EstadoFila[]): ResumenPreguntas {
  return {
    total: filas.length,
    sinContestar: filas.filter((f) => !f.respondida_en).length,
    enviadas: filas.filter((f) => f.respondida_en && !f.recogida_en).length,
  };
}

// El resumen de cada proyecto, para la portada.
export const resumenPreguntas = cache(async () => {
  const supabase = await supabaseServidor();
  const r = await supabase.from("preguntas").select("video_id, respondida_en, recogida_en");
  const porVideo = new Map<string, EstadoFila[]>();
  for (const f of comprobar(r, "las preguntas")) porVideo.set(f.video_id, [...(porVideo.get(f.video_id) ?? []), f]);
  return new Map([...porVideo].map(([id, filas]) => [id, resumir(filas)]));
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

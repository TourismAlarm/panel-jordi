import "server-only";
import { cache } from "react";
import { supabaseServidor } from "@/lib/supabase/server";
import type { Fila } from "@/lib/supabase/tipos";
import type { Motivo } from "@/lib/estados";
import { comprobar } from "./comun";

// Lo que pides desde el móvil y el PC recoge: descartar un proyecto o un guion para otro trabajo.
// Mismo patrón que las respuestas: la app lo apunta, el PC lo recoge (recogida_en) y actúa.
export type Peticion = Fila<"peticiones">;

export const listarPeticiones = cache(async (): Promise<Peticion[]> => {
  const supabase = await supabaseServidor();
  const r = await supabase.from("peticiones").select("*").order("creada_en", { ascending: false });
  return comprobar(r, "tus peticiones");
});

// Proyectos que has descartado (esperando al PC, hechos), por id de vídeo.
// Si hay varios del mismo vídeo, gana el más reciente (la lista viene de más nuevo a más viejo).
// Un descarte que falló no cuenta: el proyecto sigue vivo (ver descartesFallidos).
export function descartesPorVideo(peticiones: Peticion[]) {
  const porVideo = new Map<string, Peticion>();
  for (const p of peticiones) {
    if (p.tipo === "descartar" && p.estado !== "fallida" && p.video_id && !porVideo.has(p.video_id)) porVideo.set(p.video_id, p);
  }
  return porVideo;
}

// Descartes que el PC no pudo hacer, por id de vídeo (el más reciente), para decirle a Jordi por qué.
export function descartesFallidos(peticiones: Peticion[]) {
  const vivos = descartesPorVideo(peticiones);
  const porVideo = new Map<string, Peticion>();
  for (const p of peticiones) {
    if (p.tipo === "descartar" && p.estado === "fallida" && p.video_id && !vivos.has(p.video_id) && !porVideo.has(p.video_id)) {
      porVideo.set(p.video_id, p);
    }
  }
  return porVideo;
}

export async function descartarProyecto(videoId: string, motivo: Motivo, texto: string | null) {
  const supabase = await supabaseServidor();
  const { error } = await supabase.from("peticiones").insert({ tipo: "descartar", video_id: videoId, motivo, texto });
  return !error;
}

export async function pedirGuionNuevo(texto: string, fecha: string | null) {
  const supabase = await supabaseServidor();
  const { error } = await supabase.from("peticiones").insert({ tipo: "nuevo", texto, fecha_trabajo: fecha });
  return !error;
}

// Deshacer: RLS solo deja borrar si el PC aún no la ha recogido.
export async function borrarPeticion(id: string): Promise<"ok" | "recogida" | "error"> {
  const supabase = await supabaseServidor();
  const { data, error } = await supabase.from("peticiones").delete().eq("id", id).select("id");
  if (error) return "error";
  return data?.length ? "ok" : "recogida";
}

import "server-only";
import { cache } from "react";
import { supabaseServidor } from "@/lib/supabase/server";
import type { Fila } from "@/lib/supabase/tipos";
import { hoy } from "@/lib/formato";
import type { Motivo } from "@/lib/estados";
import { comprobar } from "./comun";

// Lo que pides desde el móvil y cierra Antonio: descartar un proyecto, un guion para otro trabajo, material subido o una revisión.
// La app lo apunta y avisa a Antonio; él lo recoge (recogida_en), actúa y dice cómo quedó (/api/bots/peticiones).
export type Peticion = Fila<"peticiones">;

export const listarPeticiones = cache(async (): Promise<Peticion[]> => {
  const supabase = await supabaseServidor();
  const r = await supabase.from("peticiones").select("*").order("creada_en", { ascending: false });
  return comprobar(r, "tus peticiones");
});

// Proyectos que has descartado (esperando a Antonio, hechos), por id de vídeo.
// Si hay varios del mismo vídeo, gana el más reciente (la lista viene de más nuevo a más viejo).
// Un descarte que falló no cuenta: el proyecto sigue vivo (ver descartesFallidos).
export function descartesPorVideo(peticiones: Peticion[]) {
  const porVideo = new Map<string, Peticion>();
  for (const p of peticiones) {
    if (p.tipo === "descartar" && p.estado !== "fallida" && p.video_id && !porVideo.has(p.video_id)) porVideo.set(p.video_id, p);
  }
  return porVideo;
}

// Descartes que Antonio no pudo hacer, por id de vídeo (el más reciente), para decirle a Jordi por qué.
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

// Apunta la petición y devuelve su id para el aviso a Antonio. null = no se ha guardado.
async function apuntar(fila: { tipo: string; video_id?: string; motivo?: string; texto?: string | null; fecha_trabajo?: string | null; siempre?: boolean }) {
  const supabase = await supabaseServidor();
  const { data, error } = await supabase.from("peticiones").insert(fila).select("id").single();
  if (error) console.error("Petición:", error.message);
  return data?.id ?? null;
}

export function descartarProyecto(videoId: string, motivo: Motivo, texto: string | null) {
  return apuntar({ tipo: "descartar", video_id: videoId, motivo, texto });
}

export function pedirGuionNuevo(texto: string, fecha: string | null) {
  return apuntar({ tipo: "nuevo", texto, fecha_trabajo: fecha });
}

// Edición sin guion: una urgencia que ya has grabado. El proyecto se crea aquí mismo, sin pasar por el guionista ni esperar al PC.
export async function pedirEdicionSinGuion(texto: string, fecha: string | null) {
  const supabase = await supabaseServidor();
  const { error } = await supabase.rpc("crear_ge_urgencia", { p_texto: texto, p_fecha: fecha ?? hoy() });
  if (error) console.error("Urgencia → vídeo:", error.message);
  return !error;
}

// Revisión del montaje, en dos fases: el corte (corte_ok o cambios) y el acabado de ChatCut (aprobar o cambios).
// Sin encargo en la cola, la recoge Antonio (corte_ok → encarga el acabado; aprobar → cierra; cambios → encarga otra versión).
// siempre: «hazlo siempre así» → además de este montaje, Antonio lo guarda como regla del montador.
export type TipoRevision = "aprobar" | "cambios" | "corte_ok";

export function pedirRevision(videoId: string, tipo: TipoRevision, texto: string | null, siempre = false) {
  return apuntar({ tipo, video_id: videoId, texto, siempre });
}

// La última petición de revisión de un vídeo (la lista viene de más nueva a más vieja), para saber si está en manos de Antonio.
export function revisionDeVideo(peticiones: Peticion[], videoId: string) {
  return peticiones.find((p) => p.video_id === videoId && (p.tipo === "aprobar" || p.tipo === "cambios" || p.tipo === "corte_ok"));
}

// «Ya he subido todo»: Antonio no encarga el montaje hasta que llega esta petición.
export function confirmarMaterial(videoId: string) {
  return apuntar({ tipo: "material_listo", video_id: videoId });
}

// La última confirmación de material de un vídeo que no ha fallado (la lista viene de más nueva a más vieja).
export function materialDeVideo(peticiones: Peticion[], videoId: string) {
  return peticiones.find((p) => p.video_id === videoId && p.tipo === "material_listo" && p.estado !== "fallida");
}

// Deshacer: RLS solo deja borrar si Antonio aún no la ha recogido.
export async function borrarPeticion(id: string): Promise<"ok" | "recogida" | "error"> {
  const supabase = await supabaseServidor();
  const { data, error } = await supabase.from("peticiones").delete().eq("id", id).select("id");
  if (error) return "error";
  return data?.length ? "ok" : "recogida";
}

import "server-only";
import { cache } from "react";
import { supabaseServidor } from "@/lib/supabase/server";
import type { Fila } from "@/lib/supabase/tipos";
import { fichaDeGuion, type Ficha } from "@/lib/guion";
import { comprobar } from "./comun";

export type Video = Fila<"videos">;
export type VideoResumen = Omit<Video, "guion_md">;

// Todos los vídeos sin el guion (pesa), por fecha de trabajo; los que no tienen fecha, al final.
export const listarVideos = cache(async (): Promise<VideoResumen[]> => {
  const supabase = await supabaseServidor();
  const r = await supabase
    .from("videos")
    .select("id, titulo, estado, siguiente_paso, por_revisar, montaje_url, fecha_trabajo, sin_guion, actualizado_en")
    .order("fecha_trabajo", { ascending: true, nullsFirst: false });
  return comprobar(r, "los vídeos");
});

// Un proyecto = un vídeo + la ficha del trabajo (hora, lugar, camión…) sacada de su guion.
// El guion entero se queda en el servidor: a la pantalla solo llega la ficha.
export type Proyecto = VideoResumen & { ficha: Ficha; tieneGuion: boolean };

export const listarProyectos = cache(async (): Promise<Proyecto[]> => {
  const supabase = await supabaseServidor();
  const r = await supabase
    .from("videos")
    .select("id, titulo, estado, siguiente_paso, por_revisar, montaje_url, fecha_trabajo, sin_guion, actualizado_en, guion_md")
    .order("fecha_trabajo", { ascending: true, nullsFirst: false });
  return comprobar(r, "los proyectos").map(({ guion_md, ...v }) => ({
    ...v,
    ficha: fichaDeGuion(guion_md),
    tieneGuion: !!guion_md,
  }));
});

export const obtenerVideo = cache(async (id: string): Promise<Video | null> => {
  const supabase = await supabaseServidor();
  const r = await supabase.from("videos").select("*").eq("id", id).maybeSingle();
  return comprobar(r, "el vídeo");
});

// Cuándo subió datos el PC por última vez (el vídeo tocado más recientemente).
export function ultimaSincronizacion(videos: Pick<Video, "actualizado_en">[]) {
  return videos.reduce<string | null>((m, v) => (!m || v.actualizado_en > m ? v.actualizado_en : m), null);
}

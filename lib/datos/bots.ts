import "server-only";
import { cache } from "react";
import { supabaseServidor } from "@/lib/supabase/server";
import { IDS_BOTS_ELSA } from "@/lib/bots/catalogo";
import { guionAMarkdown } from "@/lib/bots/guiones";
import type { EjecucionBot } from "@/lib/bots/resumen";
import type { Fila } from "@/lib/supabase/tipos";
import { comprobar } from "./comun";

// Lo último que han hecho los bots de Grok Bot, lo más reciente arriba.
export const actividadBots = cache(async (limite = 300): Promise<EjecucionBot[]> => {
  const supabase = await supabaseServidor();
  const r = await supabase.from("actividad_bots").select("id, bot, tarea, inicio, fin, resultado, nota, enlace").in("bot", IDS_BOTS_ELSA).order("inicio", { ascending: false }).limit(limite);
  return comprobar(r, "la actividad de los bots");
});

// ── Ideas ─────────────────────────────────────────────────
export type Idea = Fila<"ideas">;

export const listarIdeas = cache(async (): Promise<Idea[]> => {
  const supabase = await supabaseServidor();
  const r = await supabase.from("ideas").select("*").order("creado", { ascending: false }).limit(300);
  return comprobar(r, "las ideas");
});

// RLS no deja tocar una idea ya usada: 0 filas = el Guionista ya la cogió.
export async function decidirIdeaBot(id: string, estado: "me_gusta" | "descartada" | "nueva", nota: string | null): Promise<{ titulo: string } | "error" | "cerrada"> {
  const supabase = await supabaseServidor();
  const { data, error } = await supabase
    .from("ideas")
    .update({ estado, nota_jordi: nota, actualizado: new Date().toISOString() })
    .eq("id", id)
    .select("titulo");
  if (error) return "error";
  return data?.[0] ?? "cerrada";
}

// ── Guiones propuestos ────────────────────────────────────
export type GuionPropuesto = Fila<"guiones_propuestos">;

// Los que siguen vivos en el panel: por decidir, con cambios pedidos y aprobados que no se pudieron convertir en vídeo.
export const guionesAbiertos = cache(async (): Promise<GuionPropuesto[]> => {
  const supabase = await supabaseServidor();
  const r = await supabase
    .from("guiones_propuestos")
    .select("*")
    .in("estado", ["propuesto", "cambios", "aprobado"])
    .is("video_id", null)
    .order("creado", { ascending: false })
    .limit(50);
  return comprobar(r, "los guiones propuestos");
});

export async function decidirGuionPropuesto(id: string, estado: "aprobado" | "cambios" | "descartado" | "propuesto", nota: string | null) {
  const supabase = await supabaseServidor();
  const { data, error } = await supabase
    .from("guiones_propuestos")
    .update({ estado, nota_jordi: nota, actualizado: new Date().toISOString() })
    .eq("id", id)
    .select("id");
  if (error) return "error";
  return data?.length ? "ok" : "cerrado";
}

// Guion aprobado → proyecto GE, en una sola transacción. null = no se ha podido: el guion sigue aprobado y se puede reintentar.
export async function crearVideoDeGuion(id: string): Promise<string | null> {
  const supabase = await supabaseServidor();
  const { data: guion, error: eGuion } = await supabase.from("guiones_propuestos").select("*").eq("id", id).maybeSingle();
  if (eGuion || !guion) {
    console.error("Guion → vídeo:", eGuion?.message ?? "no existe");
    return null;
  }
  const { data, error } = await supabase.rpc("crear_ge_de_guion", { p_guion: id, p_guion_md: guionAMarkdown(guion) });
  if (error) console.error("Guion → vídeo:", error.message);
  return error ? null : data;
}

// ── Revisiones ────────────────────────────────────────────
export type Revision = Fila<"revisiones">;

export const revisionesDeVideo = cache(async (videoId: string): Promise<Revision[]> => {
  const supabase = await supabaseServidor();
  const r = await supabase.from("revisiones").select("*").eq("video_id", videoId).order("creado", { ascending: false }).limit(20);
  return comprobar(r, "las revisiones");
});

export async function revisionesDeGuiones(ids: string[]): Promise<Revision[]> {
  if (!ids.length) return [];
  const supabase = await supabaseServidor();
  const r = await supabase.from("revisiones").select("*").in("guion_id", ids).order("creado", { ascending: false });
  return comprobar(r, "las revisiones");
}

// clave → texto, para enseñar cada regla revisada con sus palabras.
export const textosDeReglas = cache(async (): Promise<Record<string, string>> => {
  const supabase = await supabaseServidor();
  const r = await supabase.from("reglas").select("clave, regla");
  return Object.fromEntries(comprobar(r, "las reglas").map((x) => [x.clave, x.regla]));
});

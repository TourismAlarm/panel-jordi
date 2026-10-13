import "server-only";
import { cache } from "react";
import { supabaseServidor } from "@/lib/supabase/server";
import type { Fila } from "@/lib/supabase/tipos";
import type { Foto, InfoReel, ReelWindsor } from "@/lib/redes";
import { comprobar } from "./comun";

// Redes: fotos diarias de Instagram (las toma la tarea en la nube «ELSA - windsor») y lo que el PC
// sabe de cada reel (GE, tema, duración) y el informe del analista (los sube sync_panel.py).
export type Informe = Fila<"informes_redes">;

// Las fotos de los últimos días (la última y la de hace una semana bastan, pero traemos margen).
export const fotosRecientes = cache(async (dias = 12): Promise<Foto[]> => {
  const supabase = await supabaseServidor();
  const r = await supabase.from("windsor_fotos").select("fecha, datos").order("fecha", { ascending: false }).limit(dias);
  return comprobar(r, "las estadísticas de Instagram").map((f) => ({
    fecha: f.fecha,
    reels: Array.isArray(f.datos) ? (f.datos as unknown as ReelWindsor[]) : [],
  }));
});

export const infoReels = cache(async (): Promise<InfoReel[]> => {
  const supabase = await supabaseServidor();
  const r = await supabase.from("redes_reels").select("permalink, ge, tema, gancho, duracion_s, elsa, tipo_gancho, prueba");
  return comprobar(r, "los reels");
});

export const ultimoInforme = cache(async (): Promise<Informe | null> => {
  const supabase = await supabaseServidor();
  const r = await supabase.from("informes_redes").select("*").neq("semana", "apuestas").order("fecha", { ascending: false }).limit(1);
  return comprobar(r, "el informe del analista")[0] ?? null;
});

// apuestas.md tal cual (el PC lo sube como una fila más de informes_redes, semana «apuestas»).
export const apuestasMd = cache(async (): Promise<string | null> => {
  const supabase = await supabaseServidor();
  const r = await supabase.from("informes_redes").select("markdown").eq("semana", "apuestas").limit(1);
  return comprobar(r, "las apuestas")[0]?.markdown ?? null;
});

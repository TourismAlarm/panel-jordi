import "server-only";
import { cache } from "react";
import { supabaseServidor } from "@/lib/supabase/server";
import type { Fila } from "@/lib/supabase/tipos";
import { comprobar } from "./comun";

export type Ejecucion = Pick<Fila<"ejecuciones_agentes">, "id" | "agente" | "video_id" | "fin" | "resultado" | "resumen">;

const COLUMNAS = "id, agente, video_id, fin, resultado, resumen";

// Lo último que han hecho los agentes, lo más reciente arriba.
export const actividadReciente = cache(async (limite = 60): Promise<Ejecucion[]> => {
  const supabase = await supabaseServidor();
  const r = await supabase.from("ejecuciones_agentes").select(COLUMNAS).order("fin", { ascending: false }).limit(limite);
  return comprobar(r, "la actividad");
});

export const actividadDeVideo = cache(async (videoId: string, limite = 15): Promise<Ejecucion[]> => {
  const supabase = await supabaseServidor();
  const r = await supabase
    .from("ejecuciones_agentes")
    .select(COLUMNAS)
    .eq("video_id", videoId)
    .order("fin", { ascending: false })
    .limit(limite);
  return comprobar(r, "la actividad del vídeo");
});

export type EstadoAgente = Pick<Ejecucion, "agente" | "fin" | "resultado">;

// Última ejecución de cada agente (salen solos, sin lista fija) y fallos de los últimos 7 días.
export const estadoAgentes = cache(async () => {
  const supabase = await supabaseServidor();
  const r = await supabase
    .from("ejecuciones_agentes")
    .select("agente, fin, resultado")
    .order("fin", { ascending: false })
    .limit(300);
  const filas = comprobar(r, "los agentes");

  const hace7 = Date.now() - 7 * 864e5;
  const ultima = new Map<string, EstadoAgente>();
  let fallos7d = 0;
  for (const f of filas) {
    if (!ultima.has(f.agente)) ultima.set(f.agente, f);
    const reciente = f.fin && new Date(f.fin).getTime() >= hace7;
    if (reciente && ["fallo", "error", "bloqueado"].includes(f.resultado ?? "")) fallos7d++;
  }
  return { agentes: [...ultima.values()], fallos7d };
});

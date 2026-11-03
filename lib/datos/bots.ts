import "server-only";
import { cache } from "react";
import { supabaseServidor } from "@/lib/supabase/server";
import type { EjecucionBot } from "@/lib/bots/resumen";
import { comprobar } from "./comun";

// Lo último que han hecho los bots de Grok Bot, lo más reciente arriba.
export const actividadBots = cache(async (limite = 300): Promise<EjecucionBot[]> => {
  const supabase = await supabaseServidor();
  const r = await supabase.from("actividad_bots").select("id, bot, tarea, inicio, fin, resultado, nota, enlace").order("inicio", { ascending: false }).limit(limite);
  return comprobar(r, "la actividad de los bots");
});

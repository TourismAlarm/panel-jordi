import "server-only";
import { supabaseServidor } from "@/lib/supabase/server";

// El último informe de un bot, para su pantalla. Lo de Salud solo se pide desde Salud.
export async function ultimoInforme(bot: "finanzas" | "salud") {
  const supabase = await supabaseServidor();
  const { data, error } = await supabase.from("informes_bots").select("titulo, cuerpo_md, periodo_desde, periodo_hasta, creado").eq("bot", bot).order("creado", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(`No se pudo leer el informe: ${error.message}`);
  return data;
}

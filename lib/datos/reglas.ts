import "server-only";
import { cache } from "react";
import { supabaseServidor } from "@/lib/supabase/server";
import type { Fila } from "@/lib/supabase/tipos";
import { comprobar } from "./comun";

// Lo que los agentes aprenden de ti. Las reglas viven aquí: Antonio las cambia con su porqué, tus sí/no/quitar se aplican
// al momento y todo cambio queda en reglas_historial. El PC solo se baja una copia a sistema/aprendido/.
export type Regla = Fila<"reglas">;
export type Decision = "si" | "no" | "quitar";
export type CambioDeRegla = Fila<"reglas_historial">;

export const listarReglas = cache(async (): Promise<Regla[]> => {
  const supabase = await supabaseServidor();
  const r = await supabase.from("reglas").select("*").order("creada_en", { ascending: false });
  return comprobar(r, "lo aprendido");
});

// Del más nuevo al más viejo.
export const listarCambiosDeReglas = cache(async (): Promise<CambioDeRegla[]> => {
  const supabase = await supabaseServidor();
  const r = await supabase.from("reglas_historial").select("*").order("id", { ascending: false });
  return comprobar(r, "los cambios de las reglas");
});

// Cuántas propuestas esperan tu sí o no (para el aviso de la portada).
export const contarPorDecidir = cache(async (): Promise<number> => {
  const supabase = await supabaseServidor();
  const { count, error } = await supabase
    .from("reglas")
    .select("id", { count: "exact", head: true })
    .eq("estado", "propuesta")
    .is("decision", null);
  return error ? 0 : (count ?? 0);
});

// Agrupa para la pantalla: por decidir, activas (por agente) e historial.
export function agruparReglas(reglas: Regla[]) {
  const porDecidir = reglas.filter((r) => r.estado === "propuesta");
  const activas = reglas.filter((r) => r.estado === "activa");
  const historial = reglas.filter((r) => r.estado === "rechazada" || r.estado === "quitada");
  return { porDecidir, activas, historial };
}

export async function decidirReglaYa(id: string, decision: Decision, texto: string | null) {
  const supabase = await supabaseServidor();
  const { data, error } = await supabase.rpc("regla_decidir", { p_id: id, p_decision: decision, p_texto: texto ?? "" });
  if (error) return "error";
  return data ? "ok" : "cerrada";
}

export async function deshacerCambioDeRegla(id: string) {
  const supabase = await supabaseServidor();
  const { data, error } = await supabase.rpc("regla_deshacer", { p_id: id });
  if (error) return "error";
  return data ? "ok" : "cerrada";
}

import "server-only";
import { cache } from "react";
import { supabaseServidor } from "@/lib/supabase/server";
import type { Fila } from "@/lib/supabase/tipos";
import { comprobar } from "./comun";

// Lo que los agentes aprenden de ti. Ellos proponen (estado «propuesta»), tú decides aquí (decision)
// y el PC lo escribe en sistema/aprendido/<agente>.md en el siguiente ciclo (estado «activa»).
// Mismo patrón que las respuestas: la app solo apunta la decisión; el PC la recoge y actúa.
export type Regla = Fila<"reglas">;
export type Decision = "si" | "no" | "quitar";

export const listarReglas = cache(async (): Promise<Regla[]> => {
  const supabase = await supabaseServidor();
  const r = await supabase.from("reglas").select("*").order("creada_en", { ascending: false });
  return comprobar(r, "lo aprendido");
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

// Agrupa para la pantalla: por decidir, esperando al PC, activas (por agente) e historial.
export function agruparReglas(reglas: Regla[]) {
  const porDecidir = reglas.filter((r) => r.estado === "propuesta" && !r.decision);
  const esperando = reglas.filter((r) => (r.estado === "propuesta" && r.decision) || (r.estado === "activa" && r.decision === "quitar"));
  const activas = reglas.filter((r) => r.estado === "activa" && r.decision !== "quitar");
  const historial = reglas.filter((r) => r.estado === "rechazada" || r.estado === "quitada");
  return { porDecidir, esperando, activas, historial };
}

// RLS solo deja tocar decision/decision_texto/decidida_en de propuestas y activas.
// null = deshacer (mientras el PC no la haya recogido).
export async function guardarDecision(id: string, decision: Decision | null, texto: string | null) {
  const supabase = await supabaseServidor();
  const { data, error } = await supabase
    .from("reglas")
    .update({ decision, decision_texto: texto, decidida_en: decision ? new Date().toISOString() : null })
    .eq("id", id)
    .in("estado", ["propuesta", "activa"])
    .select("id");
  if (error) return "error";
  return data?.length ? "ok" : "recogida";
}

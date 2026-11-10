import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/tipos";
import { reunirPendientes } from "./calculados";
import { ESTADOS_ABIERTOS, porAgente, rutinasVista, tareasAbiertas, type GrupoAgente, type RutinaVista, type TareaVista } from "./vista";

export type Memoria = { clave: string; contenido: string; tipo: string; autor: string; actualizado: string };

export type Arnes = {
  generado_en: string;
  tareas: TareaVista[]; // a medias
  por_agente: GrupoAgente[];
  rutinas: RutinaVista[];
  memoria: Memoria[]; // lo que todos deben saber: hechos, preferencias, decisiones, skills y problemas
  fallos: string[]; // lo que no se ha podido leer
};

const COLUMNAS_TAREA = "id, titulo, agente, estado, paso_actual, falta, enlace, empezada_en, actualizado_en";
const COLUMNAS_RUTINA = "id, nombre, horario, ultima_ejecucion, resultado, proxima, nota, actualizado, activa";

// Todo el arnés de una vez: lo que escribe Antonio (rutinas y tareas) y lo que se calcula del panel.
export async function leerArnes(db: SupabaseClient<Database>, userId: string): Promise<Arnes> {
  const ahora = Date.now();
  const [t, r, m, calculados] = await Promise.all([
    db.from("arnes_tareas").select(COLUMNAS_TAREA).eq("user_id", userId).in("estado", [...ESTADOS_ABIERTOS]),
    db.from("arnes_rutinas").select(COLUMNAS_RUTINA).eq("user_id", userId),
    db.from("memoria_comun").select("clave, contenido, tipo, autor, actualizado").order("actualizado", { ascending: false }).limit(200),
    reunirPendientes(db, userId),
  ]);
  const fallos = [...calculados.fallos];
  if (t.error) fallos.push("Tareas a medias");
  if (r.error) fallos.push("Rutinas");
  if (m.error) fallos.push("Memoria");
  for (const e of [t.error, r.error, m.error]) if (e) console.error("Arnés:", e.message);

  const tareas = tareasAbiertas(t.data ?? [], ahora);
  return {
    generado_en: new Date(ahora).toISOString(),
    tareas,
    por_agente: porAgente(calculados.pendientes, tareas),
    rutinas: rutinasVista(r.data ?? [], ahora),
    memoria: m.data ?? [],
    fallos,
  };
}

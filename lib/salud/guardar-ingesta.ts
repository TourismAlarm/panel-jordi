import "server-only";
import { duenoId } from "@/lib/datos/dueno";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { CuerpoIngesta } from "./ingesta";

// Guarda lo que llega de Garmin. Repetir el envío no duplica: se sobrescribe por día+métrica+fuente, y un entreno por fuente+id_externo.
export async function guardarIngesta({ metricas, entrenos }: Pick<CuerpoIngesta, "metricas" | "entrenos">) {
  const db = supabaseAdmin();
  const user_id = await duenoId();
  const ahora = new Date().toISOString();

  // Si el mismo día+métrica llega dos veces en el mismo envío, gana la última.
  const unicas = new Map<string, (typeof metricas)[number]>();
  for (const m of metricas) unicas.set(`${m.fecha}|${m.metrica}|${m.fuente}`, m);
  const filasMetricas = [...unicas.values()].map((m) => ({ user_id, fecha: m.fecha, metrica: m.metrica, valor: m.valor, unidad: m.unidad ?? null, fuente: m.fuente, actualizado_en: ahora }));
  for (let i = 0; i < filasMetricas.length; i += 500) {
    const { error } = await db.from("sal_metricas").upsert(filasMetricas.slice(i, i + 500), { onConflict: "user_id,fecha,metrica,fuente" });
    if (error) throw new Error(`métricas: ${error.message}`);
  }

  // Entrenos: se actualiza el que ya existe (misma fuente + id_externo) y se crea el nuevo.
  let nuevos = 0;
  let actualizados = 0;
  for (const e of entrenos) {
    const fila = { user_id, fecha: e.fecha, tipo: e.tipo, duracion_min: e.duracion_min ?? null, distancia_km: e.distancia_km ?? null, calorias: e.calorias ?? null, fc_media: e.fc_media ?? null, fuente: e.fuente, id_externo: e.id_externo, actualizado_en: ahora };
    const { data: previo } = await db.from("sal_entrenos").select("id").eq("user_id", user_id).eq("fuente", e.fuente).eq("id_externo", e.id_externo).maybeSingle();
    const { error } = previo ? await db.from("sal_entrenos").update(fila).eq("id", previo.id) : await db.from("sal_entrenos").insert(fila);
    if (error) throw new Error(`entrenos: ${error.message}`);
    if (previo) actualizados++;
    else nuevos++;
  }

  return { metricas: filasMetricas.length, entrenos: { nuevos, actualizados } };
}

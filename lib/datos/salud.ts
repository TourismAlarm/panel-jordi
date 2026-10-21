import "server-only";
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseServidor } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/tipos";
import { aISODia, sumarDias } from "@/lib/fechas";
import type { Series, RegistroReciente, EntrenoReciente } from "@/lib/salud/resumen";

export type DatosSalud = {
  hoy: string;
  series: Series;
  registros: (RegistroReciente & { id: string; intensidad: number | null; creado_en: string })[];
  entrenos: (EntrenoReciente & { distancia_km: number | null; calorias: number | null; fc_media: number | null })[];
  ultimaActualizacion: string | null; // cuándo llegó el último dato del reloj/PC
};

// Lee con la sesión de Jordi (RLS). Si hay varios datos del mismo día y métrica, se queda con el más reciente.
export const cargarSalud = cache(async (dias = 90): Promise<DatosSalud> => leerSalud(await supabaseServidor(), dias));

// También la usa «Hoy» desde el cron (con la service_role): entonces hay que pasar userId para filtrar.
export async function leerSalud(supabase: SupabaseClient<Database>, dias = 90, userId?: string): Promise<DatosSalud> {
  const hoy = aISODia();
  const desde = sumarDias(hoy, -dias);
  const donde = userId ? { user_id: userId } : {};

  const [m, r, e, u] = await Promise.all([
    supabase.from("sal_metricas").select("fecha, metrica, valor, actualizado_en").match(donde).gte("fecha", desde).order("fecha", { ascending: true }).limit(5000),
    supabase.from("sal_registros").select("id, fecha, tipo, etiqueta, texto, intensidad, aviso_medico, creado_en").match(donde).gte("fecha", sumarDias(hoy, -30)).order("creado_en", { ascending: false }).limit(100),
    supabase.from("sal_entrenos").select("fecha, tipo, duracion_min, distancia_km, calorias, fc_media").match(donde).gte("fecha", desde).order("fecha", { ascending: false }).limit(300),
    supabase.from("sal_metricas").select("actualizado_en").match(donde).neq("fuente", "manual").order("actualizado_en", { ascending: false }).limit(1),
  ]);
  for (const x of [m, r, e, u]) if (x.error) throw new Error(`No se pudo leer Salud: ${x.error.message}`);

  const porDia = new Map<string, { fecha: string; valor: number; act: string }>();
  for (const f of m.data ?? []) {
    const k = `${f.metrica}|${f.fecha}`;
    const prev = porDia.get(k);
    if (!prev || f.actualizado_en > prev.act) porDia.set(k, { fecha: f.fecha, valor: Number(f.valor), act: f.actualizado_en });
  }
  const series: Series = {};
  for (const [k, v] of porDia) (series[k.split("|")[0]] ??= []).push({ fecha: v.fecha, valor: v.valor });
  for (const s of Object.values(series)) s.sort((a, b) => a.fecha.localeCompare(b.fecha));

  return {
    hoy,
    series,
    registros: r.data ?? [],
    entrenos: (e.data ?? []).map((x) => ({ ...x, duracion_min: x.duracion_min === null ? null : Number(x.duracion_min), distancia_km: x.distancia_km === null ? null : Number(x.distancia_km), calorias: x.calorias === null ? null : Number(x.calorias), fc_media: x.fc_media === null ? null : Number(x.fc_media) })),
    ultimaActualizacion: u.data?.[0]?.actualizado_en ?? null,
  };
}

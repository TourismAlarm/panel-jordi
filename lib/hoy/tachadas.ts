import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sumarDias } from "@/lib/fechas";
import type { Database } from "@/lib/supabase/tipos";
import { DIAS_TACHADO, tachadasDe } from "./prioridades";

// Lo que Jordi tachó a mano en los DIAS_TACHADO días anteriores a `fecha` (sin contarla): clave → día en que lo tachó.
// Siempre filtrado por user_id: sirve con la sesión de Jordi y con service_role.
export async function leerTachadas(db: SupabaseClient<Database>, userId: string, fecha: string): Promise<Record<string, string>> {
  const { data, error } = await db
    .from("resumenes_diarios")
    .select("fecha, prioridades, marcas")
    .eq("user_id", userId)
    .gte("fecha", sumarDias(fecha, -DIAS_TACHADO))
    .lt("fecha", fecha);
  if (error) throw new Error(error.message);
  return tachadasDe(data ?? []);
}

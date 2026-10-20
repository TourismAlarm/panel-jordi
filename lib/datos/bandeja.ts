import "server-only";
import { cache } from "react";
import { supabaseServidor } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/tipos";

export type Aviso = Database["public"]["Tables"]["bandeja"]["Row"];
export type Modulo = "hoy" | "finanzas" | "salud" | "elsa" | "documentos" | "sistema";
export type TipoBandeja = "aviso" | "pregunta" | "borrador";

export const listarBandeja = cache(async (): Promise<Aviso[]> => {
  const supabase = await supabaseServidor();
  const { data, error } = await supabase.from("bandeja").select("*").order("created_at", { ascending: false }).limit(200);
  if (error) throw new Error(`No se pudo leer la bandeja: ${error.message}`);
  return data;
});

export const contarNuevos = cache(async (): Promise<number> => {
  const supabase = await supabaseServidor();
  const { count } = await supabase.from("bandeja").select("id", { count: "exact", head: true }).eq("estado", "nuevo");
  return count ?? 0;
});

export async function marcarLeido(id: string): Promise<boolean> {
  const supabase = await supabaseServidor();
  const { error } = await supabase.from("bandeja").update({ estado: "leido" }).eq("id", id).eq("estado", "nuevo");
  return !error;
}

export async function guardarRespuestaBandeja(id: string, respuesta: string): Promise<boolean> {
  const supabase = await supabaseServidor();
  const { error } = await supabase.from("bandeja").update({ estado: "respondido", respuesta }).eq("id", id);
  return !error;
}

// Para crons y agentes: deja un aviso, pregunta o borrador al propietario (usa la service_role).
export async function dejarEnBandeja(p: { modulo: Modulo; tipo: TipoBandeja; titulo: string; cuerpo?: string }) {
  const admin = supabaseAdmin();
  const { data: dueno, error: e1 } = await admin.from("permitidos").select("user_id").limit(1).single();
  if (e1) throw new Error(`No hay usuario permitido: ${e1.message}`);
  const { error } = await admin.from("bandeja").insert({ user_id: dueno.user_id, ...p, cuerpo: p.cuerpo ?? null });
  if (error) throw new Error(`No se pudo dejar el aviso: ${error.message}`);
}

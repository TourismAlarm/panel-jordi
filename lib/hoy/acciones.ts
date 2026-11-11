"use server";

import { revalidatePath } from "next/cache";
import { correoPermitido } from "@/lib/acceso";
import { desconectarGoogle } from "@/lib/google/cliente";
import { enviarAviso } from "@/lib/bots/aviso";
import { aISODia } from "@/lib/fechas";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServidor } from "@/lib/supabase/server";
import { leerMarcas } from "./prioridades";
import { generarResumen } from "./generar";

export async function desconectarGoogleAccion(): Promise<void> {
  const { data } = await (await supabaseServidor()).auth.getClaims();
  const id = data?.claims?.sub;
  if (!id || !correoPermitido(data?.claims?.email as string | undefined)) return;
  await desconectarGoogle(id);
  revalidatePath("/", "layout");
}

// Tachar o destachar a mano una cosa de hoy. Se guarda en la fila del día: lo ves en cualquier dispositivo y Antonio lo lee.
export async function marcarCosa(fecha: string, texto: string, hecha: boolean): Promise<boolean> {
  const { data } = await (await supabaseServidor()).auth.getClaims();
  const id = data?.claims?.sub;
  if (!id || !correoPermitido(data?.claims?.email as string | undefined)) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !texto || texto.length > 300 || typeof hecha !== "boolean") return false;
  const db = supabaseAdmin();
  const fila = await db.from("resumenes_diarios").select("marcas").eq("user_id", id).eq("fecha", fecha).maybeSingle();
  if (fila.error || !fila.data) return false;
  const marcas = { ...leerMarcas(fila.data.marcas), [texto]: hecha };
  const { error } = await db.from("resumenes_diarios").update({ marcas }).eq("user_id", id).eq("fecha", fecha);
  if (error) console.error("marcarCosa:", error.message);
  return !error;
}

export type ResultadoResumen = { avisado: boolean } | { error: string } | null;

// «Pedir el resumen a Antonio»: lo escribe el bot Día y llega al rato. Si Antonio no responde, el resumen sencillo del panel.
export async function actualizarResumen(): Promise<ResultadoResumen> {
  const { data } = await (await supabaseServidor()).auth.getClaims();
  const id = data?.claims?.sub;
  if (!id || !correoPermitido(data?.claims?.email as string | undefined)) return { error: "No autorizado." };
  try {
    if (await enviarAviso({ evento: "resumen_pedido", fecha: aISODia() })) return { avisado: true };
    await generarResumen({ forzar: true, userId: id });
    revalidatePath("/");
    return { avisado: false };
  } catch (e) {
    console.error("actualizarResumen:", e instanceof Error ? e.message : e);
    return { error: "No se ha podido preparar el resumen. Prueba otra vez." };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { correoPermitido } from "@/lib/acceso";
import { desconectarGoogle } from "@/lib/google/cliente";
import { enviarAviso } from "@/lib/bots/aviso";
import { aISODia } from "@/lib/fechas";
import { supabaseServidor } from "@/lib/supabase/server";
import { generarResumen } from "./generar";

export async function desconectarGoogleAccion(): Promise<void> {
  const { data } = await (await supabaseServidor()).auth.getClaims();
  const id = data?.claims?.sub;
  if (!id || !correoPermitido(data?.claims?.email as string | undefined)) return;
  await desconectarGoogle(id);
  revalidatePath("/", "layout");
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

"use server";

import { revalidatePath } from "next/cache";
import { correoPermitido } from "@/lib/acceso";
import { desconectarGoogle } from "@/lib/google/cliente";
import type { Resultado } from "@/lib/acciones";
import { supabaseServidor } from "@/lib/supabase/server";
import { generarResumen } from "./generar";

export async function desconectarGoogleAccion(): Promise<void> {
  const { data } = await (await supabaseServidor()).auth.getClaims();
  const id = data?.claims?.sub;
  if (!id || !correoPermitido(data?.claims?.email as string | undefined)) return;
  await desconectarGoogle(id);
  revalidatePath("/", "layout");
}

// «Actualizar resumen»: lo genera de nuevo con la IA (aunque ya hubiera uno de hoy).
export async function actualizarResumen(): Promise<Resultado> {
  const { data } = await (await supabaseServidor()).auth.getClaims();
  const id = data?.claims?.sub;
  if (!id || !correoPermitido(data?.claims?.email as string | undefined)) return { error: "No autorizado." };
  try {
    await generarResumen({ forzar: true, userId: id });
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    console.error("actualizarResumen:", e instanceof Error ? e.message : e);
    return { error: "No se ha podido generar el resumen. Prueba otra vez." };
  }
}

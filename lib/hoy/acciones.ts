"use server";

import { revalidatePath } from "next/cache";
import { correoPermitido } from "@/lib/acceso";
import type { Resultado } from "@/lib/acciones";
import { desconectarGoogle } from "@/lib/google/cliente";
import { supabaseServidor } from "@/lib/supabase/server";
import { generarYEnviarResumen } from "./enviar";

async function usuarioPermitido() {
  const { data } = await (await supabaseServidor()).auth.getClaims();
  const id = data?.claims?.sub;
  return id && correoPermitido(data?.claims?.email as string | undefined) ? id : null;
}

// «Enviar resumen ahora»: lo genera de nuevo y lo manda a tu correo (aunque ya se hubiera enviado hoy).
export async function enviarResumenAhora(): Promise<Resultado> {
  if (!(await usuarioPermitido())) return { error: "No autorizado." };
  try {
    const r = await generarYEnviarResumen({ forzar: true });
    revalidatePath("/");
    if (r.estado === "guardado-sin-correo") return { error: `Resumen listo, pero el correo no salió: ${r.errorCorreo ?? "error"}` };
    return { ok: true };
  } catch (e) {
    console.error("enviarResumenAhora:", e instanceof Error ? e.message : e);
    return { error: "No se ha podido generar el resumen. Prueba otra vez." };
  }
}

export async function desconectarGoogleAccion(): Promise<void> {
  const id = await usuarioPermitido();
  if (!id) return;
  await desconectarGoogle(id);
  revalidatePath("/", "layout");
}

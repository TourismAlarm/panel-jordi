"use server";

import { revalidatePath } from "next/cache";
import { correoPermitido } from "@/lib/acceso";
import { desconectarGoogle } from "@/lib/google/cliente";
import { supabaseServidor } from "@/lib/supabase/server";

export async function desconectarGoogleAccion(): Promise<void> {
  const { data } = await (await supabaseServidor()).auth.getClaims();
  const id = data?.claims?.sub;
  if (!id || !correoPermitido(data?.claims?.email as string | undefined)) return;
  await desconectarGoogle(id);
  revalidatePath("/", "layout");
}

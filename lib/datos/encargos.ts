import "server-only";
import { cache } from "react";
import { supabaseServidor } from "@/lib/supabase/server";
import type { Fila } from "@/lib/supabase/tipos";
import { comprobar } from "./comun";

// La cola de edición: los escriben Antonio y el PC por /api/bots/edicion. Aquí solo se leen y Jordi decide sobre lo entregado (corte o acabado).
export type Encargo = Fila<"encargos_edicion">;

export const encargosDeVideo = cache(async (videoId: string): Promise<Encargo[]> => {
  const supabase = await supabaseServidor();
  const r = await supabase.from("encargos_edicion").select("*").eq("video_id", videoId).order("version", { ascending: false });
  return comprobar(r, "los encargos de edición");
});

// true = decidido al momento · false = este vídeo no tiene nada entregado de la cola por decidir.
export async function decidirEncargo(videoId: string, tipo: "aprobar" | "cambios" | "corte_ok", texto: string, siempre: boolean): Promise<boolean | "error"> {
  const supabase = await supabaseServidor();
  const { data, error } = await supabase.rpc("decidir_encargo", { p_video: videoId, p_tipo: tipo, p_texto: texto, p_siempre: siempre });
  return error ? "error" : !!data;
}

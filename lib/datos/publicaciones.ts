import "server-only";
import { cache } from "react";
import { supabaseServidor } from "@/lib/supabase/server";
import { comprobar } from "./comun";

// Cuándo sale cada vídeo en cada red: lo escribe Antonio por /api/bots/publicaciones. Aquí solo se lee.
export const listarPublicaciones = cache(async () => {
  const supabase = await supabaseServidor();
  const r = await supabase.from("publicaciones").select("video_id, red, estado, fecha, enlace");
  return comprobar(r, "las publicaciones");
});

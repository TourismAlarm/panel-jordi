import "server-only";
import { cache } from "react";
import { supabaseServidor } from "@/lib/supabase/server";
import type { Tono } from "@/components/ui/tono";
import { haceCuanto, hora } from "@/lib/formato";
import { comprobar } from "./comun";

// Si el PC no ha terminado un ciclo bien en este tiempo, el panel lo dice.
const LIMITE_MIN = 30;

export type EstadoSync = { ok: boolean; texto: string; tono: Tono };

// El latido que deja el sync del PC en cada ciclo (tabla sync_estado, una sola fila).
export const estadoSync = cache(async (): Promise<EstadoSync> => {
  const supabase = await supabaseServidor();
  const r = await supabase.from("sync_estado").select("*").eq("id", 1).maybeSingle();
  const fila = comprobar(r, "el estado del PC");
  const ok = fila?.ultimo_ok ?? null;
  if (ok && Date.now() - new Date(ok).getTime() < LIMITE_MIN * 60000) {
    return { ok: true, texto: `PC ✓ ${haceCuanto(ok)}`, tono: "bien" };
  }
  const desde = ok ? `sin respuesta desde ${hora(ok)}` : "sin respuesta";
  return { ok: false, texto: `PC ✗ ${desde}${fila?.mensaje ? ` · ${fila.mensaje}` : ""}`, tono: "mal" };
});

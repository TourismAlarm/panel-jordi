import "server-only";
import { cache } from "react";
import { supabaseServidor } from "@/lib/supabase/server";
import type { Tono } from "@/components/ui/tono";
import { haceCuanto, hora } from "@/lib/formato";
import { masReciente } from "@/lib/hoy/senales";
import { comprobar } from "./comun";

// Si nadie ha dado señal en este tiempo, el panel lo dice. Antonio pasa cada hora: tres horas sin nada ya es raro.
const LIMITE_MIN = 180;

export type EstadoSync = { ok: boolean; texto: string; tono: Tono };

// ¿Sigue vivo el sistema? Vale la señal de cualquiera: lo último que ha apuntado un bot (actividad_bots)
// o el latido del PC (sync_estado), mientras siga encendido. Así el panel no depende de un ordenador concreto.
export const estadoSync = cache(async (): Promise<EstadoSync> => {
  const supabase = await supabaseServidor();
  const [pc, bots] = await Promise.all([
    supabase.from("sync_estado").select("ultimo_ok").eq("id", 1).maybeSingle(),
    supabase.from("actividad_bots").select("inicio").order("inicio", { ascending: false }).limit(1),
  ]);
  const ultima = masReciente(comprobar(pc, "el estado del PC")?.ultimo_ok, comprobar(bots, "la actividad de los bots")[0]?.inicio);
  if (ultima && Date.now() - new Date(ultima).getTime() < LIMITE_MIN * 60000) {
    return { ok: true, texto: `Bots ✓ ${haceCuanto(ultima)}`, tono: "bien" };
  }
  return { ok: false, texto: ultima ? `Bots ✗ sin señal desde ${hora(ultima)}` : "Bots ✗ sin señal", tono: "mal" };
});

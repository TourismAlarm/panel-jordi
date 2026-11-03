import "server-only";
import { after } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { tacharDatos } from "./limpieza";

// Avisa a Antonio al momento de lo que decide Jordi. Dispara y olvida: el clic nunca depende de esto.
// Si falla o faltan las variables, queda en actividad_bots. Su rutina de cada hora es la red de seguridad.
export type EventoAviso =
  | { evento: "idea_me_gusta"; idea_id: string; titulo: string; nota_jordi: string | null }
  | { evento: "guion_cambios"; guion_id: string; nota_jordi: string | null }
  | { evento: "guion_aprobado"; guion_id: string; video_id: string }
  | { evento: "material_listo"; video_id: string }
  | { evento: "montaje_revisado"; video_id: string; decision: string; texto: string | null };

const PANEL = "https://panel-jordi.vercel.app";
const ESPERA_MS = 5000;

const limpio = (v: string | undefined) => v?.trim().replace(/^["']|["']$/g, "").trim() || null;

// Lo que escribe Jordi puede llevar un teléfono o un precio: hacia fuera sale tachado.
export function cuerpoAviso(e: EventoAviso, cuando: Date) {
  const cuerpo: Record<string, unknown> = { ...e, cuando: cuando.toISOString(), panel: PANEL };
  for (const campo of ["titulo", "nota_jordi", "texto"]) {
    if (typeof cuerpo[campo] === "string") cuerpo[campo] = tacharDatos(cuerpo[campo]);
  }
  return cuerpo;
}

// GROKBOT_WEBHOOK_HEADER dice cómo va la clave: «X-Api-Key» o «Authorization: Bearer <clave>» (por defecto).
export function cabeceraAviso(clave: string, formato: string | null | undefined): [string, string] {
  const f = formato?.trim() || "Authorization: Bearer <clave>";
  const i = f.indexOf(":");
  if (i < 0) return [f, clave];
  return [f.slice(0, i).trim(), f.slice(i + 1).trim().replace("<clave>", clave) || clave];
}

async function apuntarFallo(evento: string, inicio: Date, nota: string) {
  try {
    const { error } = await supabaseAdmin().from("actividad_bots").insert({
      bot: "antonio",
      tarea: `Aviso del panel: ${evento}`,
      inicio: inicio.toISOString(),
      fin: new Date().toISOString(),
      resultado: "fallo",
      nota,
    });
    if (error) console.error("Bots · aviso:", error.message);
  } catch (e) {
    console.error("Bots · aviso:", e);
  }
}

// Nunca lanza.
export async function enviarAviso(e: EventoAviso) {
  const inicio = new Date();
  const url = limpio(process.env.GROKBOT_WEBHOOK_URL);
  const clave = limpio(process.env.GROKBOT_WEBHOOK_KEY);
  if (!url || !clave) return apuntarFallo(e.evento, inicio, "Faltan GROKBOT_WEBHOOK_URL o GROKBOT_WEBHOOK_KEY");

  const [cabecera, valor] = cabeceraAviso(clave, limpio(process.env.GROKBOT_WEBHOOK_HEADER));
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", [cabecera]: valor },
      body: JSON.stringify(cuerpoAviso(e, inicio)),
      signal: AbortSignal.timeout(ESPERA_MS),
    });
    if (!r.ok) await apuntarFallo(e.evento, inicio, `El webhook respondió ${r.status}`);
  } catch (error) {
    await apuntarFallo(e.evento, inicio, error instanceof Error && error.name === "TimeoutError" ? "El webhook no respondió en 5 s" : "No se pudo llamar al webhook");
  }
}

// Se envía cuando Jordi ya tiene su respuesta.
export function avisarAntonio(e: EventoAviso) {
  after(() => enviarAviso(e));
}

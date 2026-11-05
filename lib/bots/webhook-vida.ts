import "server-only";
import { after } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Bot } from "./catalogo";

// Avisos a los bots de vida. Dispara y olvida: una subida o el cron nunca dependen de esto.
// Sin variables no hace nada. Si falla, queda en actividad_bots. Nunca lleva el contenido del archivo.
const ESPERA_MS = 5000;
const limpio = (v: string | undefined) => v?.trim().replace(/^["']|["']$/g, "").trim() || null;

export type DocumentoNuevo = { id: string; nombre: string; mime: string | null; categoria: string; subido_en: string };

export function cuerpoDocumento(d: DocumentoNuevo) {
  return { evento: "documento_nuevo", documento_id: d.id, nombre: d.nombre, mime: d.mime, categoria: d.categoria, subido_en: d.subido_en };
}

async function apuntarFallo(bot: Bot, evento: string, inicio: Date, nota: string) {
  try {
    const { error } = await supabaseAdmin().from("actividad_bots").insert({ bot, tarea: `Aviso del panel: ${evento}`, inicio: inicio.toISOString(), fin: new Date().toISOString(), resultado: "fallo", nota });
    if (error) console.error("Bots · webhook:", error.message);
  } catch (e) {
    console.error("Bots · webhook:", e);
  }
}

// Nunca lanza.
async function enviar(bot: Bot, urlCruda: string | undefined, claveCruda: string | undefined, cuerpo: { evento: string; [k: string]: unknown }) {
  const url = limpio(urlCruda);
  const clave = limpio(claveCruda);
  if (!url || !clave) return;
  const inicio = new Date();
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${clave}` },
      body: JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(ESPERA_MS),
    });
    if (!r.ok) await apuntarFallo(bot, cuerpo.evento, inicio, `El webhook respondió ${r.status}`);
  } catch (error) {
    await apuntarFallo(bot, cuerpo.evento, inicio, error instanceof Error && error.name === "TimeoutError" ? "El webhook no respondió en 5 s" : "No se pudo llamar al webhook");
  }
}

export async function enviarDocumentos(docs: DocumentoNuevo[]) {
  for (const d of docs) await enviar("documentos", process.env.GROKBOT_DOCS_WEBHOOK_URL, process.env.GROKBOT_DOCS_WEBHOOK_KEY, cuerpoDocumento(d));
}

export async function enviarDia(fecha: string) {
  await enviar("dia", process.env.GROKBOT_DIA_WEBHOOK_URL, process.env.GROKBOT_DIA_WEBHOOK_KEY, { evento: "dia", fecha });
}

// Se envía cuando Jordi ya tiene su respuesta.
export function avisarDocumentos(docs: DocumentoNuevo[]) {
  after(() => enviarDocumentos(docs));
}

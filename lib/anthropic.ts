import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { ZodType } from "zod";

export const MODELO = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

// Reglas que van en CADA llamada a la IA, pidan lo que pidan los módulos.
export const REGLAS_BASE = [
  "Responde SIEMPRE y SOLO con un objeto JSON válido, sin texto fuera del JSON ni bloques de código.",
  "No des recomendaciones de inversión (qué comprar, vender o mantener) ni previsiones de rentabilidad.",
  "No diagnostiques ni recetes. Ante dolor agudo, mareo o una condición médica, recomienda consultar a un médico.",
  "Puedes explicar cláusulas de un documento, pero no des interpretaciones legales.",
  "Si un dato no aparece en el material, escribe «no especificado». No lo completes con suposiciones.",
].join("\n");

type Cliente = Pick<Anthropic, "messages">;
let cliente: Cliente | null = null;

function obtenerCliente(): Cliente {
  if (!cliente) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("Falta ANTHROPIC_API_KEY.");
    cliente = new Anthropic({ apiKey, maxRetries: 3 }); // reintenta 429 y 5xx con espera creciente
  }
  return cliente;
}

export type PeticionJSON<T> = {
  system: string;
  usuario: string | Anthropic.MessageParam["content"];
  esquema: ZodType<T>;
  maxTokens?: number;
  reintentosFormato?: number; // veces que se vuelve a pedir si el JSON no valida
  cliente?: Cliente; // para pruebas
};

export function extraerJSON(texto: string): unknown {
  const limpio = texto.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const ini = limpio.indexOf("{");
  const fin = limpio.lastIndexOf("}");
  if (ini < 0 || fin < ini) throw new Error("La respuesta no contiene JSON.");
  return JSON.parse(limpio.slice(ini, fin + 1));
}

// Llama a la IA y devuelve el JSON ya validado con Zod. Si no valida, se lo explica y reintenta.
export async function pedirJSON<T>(p: PeticionJSON<T>): Promise<T> {
  const c = p.cliente ?? obtenerCliente();
  const intentos = (p.reintentosFormato ?? 2) + 1;
  const mensajes: Anthropic.MessageParam[] = [{ role: "user", content: p.usuario }];
  let ultimoError = "";

  for (let i = 0; i < intentos; i++) {
    const r = await c.messages.create({
      model: MODELO,
      max_tokens: p.maxTokens ?? 2048,
      system: `${p.system}\n\n${REGLAS_BASE}`,
      messages: mensajes,
    });
    const texto = r.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    try {
      const valido = p.esquema.safeParse(extraerJSON(texto));
      if (valido.success) return valido.data;
      ultimoError = valido.error.message;
    } catch (e) {
      ultimoError = e instanceof Error ? e.message : String(e);
    }
    mensajes.push(
      { role: "assistant", content: texto || "{}" },
      { role: "user", content: `Tu respuesta no es válida (${ultimoError.slice(0, 400)}). Devuelve solo el JSON corregido.` },
    );
  }
  throw new Error(`La IA no devolvió un JSON válido tras ${intentos} intentos.`);
}

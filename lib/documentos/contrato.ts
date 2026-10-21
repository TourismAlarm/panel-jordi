import { z } from "zod";
import { CATEGORIAS } from "./categorias";

const texto = (max: number) => z.string().trim().min(1).max(max);
const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "AAAA-MM-DD");
const NO_ESPECIFICADO = /^\s*(no especificado|n\/a|desconocido|—|-)?\s*$/i;

// Número de referencia sensible: solo se guardan los últimos 4 dígitos/caracteres, como «···1234».
export function ultimos4(ref: string | null | undefined): string | null {
  if (!ref || NO_ESPECIFICADO.test(ref)) return null;
  const limpio = ref.replace(/[\s·.\-/*]/g, "");
  return limpio.length ? `···${limpio.slice(-4)}` : null;
}

// «no especificado» (o vacío) = sin dato: se guarda como null, nunca se inventa.
const opcional = <T extends z.ZodTypeAny>(esquema: T) => z.preprocess((v) => (typeof v === "string" && NO_ESPECIFICADO.test(v) ? null : v), esquema.nullish());

export const CuerpoResultado = z.object({
  id: z.string().uuid(),
  categoria: z.enum(CATEGORIAS),
  tipo: opcional(texto(80)),
  paginas: z.array(z.object({ pagina: z.number().int().min(1).max(2000), texto: z.string().trim().min(1).max(20_000) })).max(500).default([]),
  ficha: z
    .object({
      partes: z.array(texto(120)).max(8).default([]),
      referencia: opcional(z.string().max(60)),
      inicio: opcional(fecha),
      vencimiento: opcional(fecha),
      importes: z.array(z.object({ concepto: texto(80), importe: z.number().finite() })).max(10).default([]),
      condiciones: z.array(texto(240)).max(3).default([]),
      contacto: opcional(z.string().max(200)),
    })
    .default({ partes: [], importes: [], condiciones: [] }),
});
export type CuerpoResultado = z.infer<typeof CuerpoResultado>;

// Fallo: la tarea no pudo leer el documento (escaneo ilegible, archivo protegido…).
export const CuerpoFallo = z.object({ id: z.string().uuid(), error: texto(300) });

import { z } from "zod";
import { IDS_AGENTES } from "./agentes";
import { ESTADOS_ABIERTOS, ESTADOS_CERRADOS } from "./vista";

// Contrato de /api/bots/arnes/*: ver docs/bots-api.md.
const instante = z.iso.datetime({ offset: true });
const texto = (max: number) => z.string().trim().min(1).max(max);
const id = z.string().trim().min(1).max(100);

// Una ruta del panel (/elsa/videos/GE_031), una web https o el chat de un agente en Grok Bot.
export const enlaceArnes = z
  .string()
  .trim()
  .max(1000)
  .refine((e) => /^\/(?!\/)/.test(e) || /^https:\/\//.test(e) || /^grokbot:\/\/app\//.test(e), { message: "tiene que ser /ruta, https://… o grokbot://app/…" });

export const RutinaIn = z.object({
  id,
  nombre: texto(200),
  horario: texto(200),
  ultima_ejecucion: instante.nullable().default(null),
  resultado: z.enum(["ok", "fallo", "nada"]).nullable().default(null),
  proxima: instante.nullable().default(null),
  nota: z.string().trim().max(2000).nullable().optional(),
});

// Siempre una lista (aunque sea de una). Un id repetido en la misma llamada no vale: no se sabría cuál gana.
export const RutinasIn = z
  .array(RutinaIn)
  .min(1)
  .max(50)
  .refine((l) => new Set(l.map((r) => r.id)).size === l.length, { message: "id repetido en la lista" });

// Abierta: tiene que decir en qué paso está, qué falta y dónde se comprueba. Al cerrarla basta con el estado.
export const TareaIn = z
  .object({
    id,
    titulo: texto(300),
    agente: z.enum(IDS_AGENTES),
    estado: z.enum([...ESTADOS_ABIERTOS, ...ESTADOS_CERRADOS]),
    paso_actual: texto(1000).optional(),
    falta: texto(2000).optional(),
    enlace: enlaceArnes.optional(),
    actualizado_en: instante,
  })
  .superRefine((t, ctx) => {
    if ((ESTADOS_CERRADOS as readonly string[]).includes(t.estado)) return;
    for (const campo of ["paso_actual", "falta", "enlace"] as const) {
      if (!t[campo]) ctx.addIssue({ code: "custom", path: [campo], message: "obligatorio mientras la tarea siga abierta" });
    }
  });

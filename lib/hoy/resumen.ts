import { z } from "zod";

const texto = (max: number) => z.string().trim().min(1).max(max);

// Lo que la tarea programada de Claude deja en el panel cada mañana. Todo es texto plano (React lo escapa al pintarlo).
export const CuerpoResumen = z.object({
  resumen: texto(900),
  prioridades: z.array(texto(200)).max(5).default([]),
  agenda: z.array(z.object({ titulo: texto(160), hora: z.string().trim().max(20).optional(), lugar: z.string().trim().max(160).optional() })).max(30).default([]),
  correos: z.array(z.object({ de: texto(120), asunto: texto(200), nota: z.string().trim().max(200).optional() })).max(15).default([]),
});
export type CuerpoResumen = z.infer<typeof CuerpoResumen>;

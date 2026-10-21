import { z } from "zod";
import { IDS_METRICAS } from "./metricas";

// Contrato del endpoint /api/salud/ingesta (lo usa el proceso del PC): ver docs/pc-salud.md
const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "fecha AAAA-MM-DD");
const fuente = z.string().min(1).max(40).refine((f) => f !== "manual", "«manual» está reservada a lo que apuntas en el panel");

export const MetricaIn = z.object({
  fecha,
  metrica: z.enum(IDS_METRICAS),
  valor: z.number().finite(),
  unidad: z.string().max(20).optional(),
  fuente: fuente.default("garmin"),
});

export const EntrenoIn = z.object({
  fecha,
  tipo: z.string().min(1).max(60),
  duracion_min: z.number().finite().nonnegative().optional(),
  distancia_km: z.number().finite().nonnegative().optional(),
  calorias: z.number().finite().nonnegative().optional(),
  fc_media: z.number().finite().nonnegative().optional(),
  fuente: fuente.default("garmin"),
  id_externo: z.string().min(1).max(100), // identificador del entreno en el origen: evita duplicados al repetir
});

export const CuerpoIngesta = z
  .object({
    metricas: z.array(MetricaIn).max(5000).default([]),
    entrenos: z.array(EntrenoIn).max(2000).default([]),
  })
  .refine((c) => c.metricas.length + c.entrenos.length > 0, "no hay nada que guardar");

export type CuerpoIngesta = z.infer<typeof CuerpoIngesta>;

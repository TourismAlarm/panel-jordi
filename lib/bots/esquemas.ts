import { z } from "zod";
import { IDS_BOTS } from "./catalogo";

// Contrato de /api/bots/*: ver docs/bots-api.md.
const instante = z.iso.datetime({ offset: true });
const url = z.url({ protocol: /^https?$/ }).max(1000);
const texto = (max: number) => z.string().trim().min(1).max(max);
const uuid = z.uuid();

// Para quién trabaja la llamada. Sin él, firma el dueño de la clave.
export const IdBot = z.enum(IDS_BOTS as [string, ...string[]]).transform((b) => b as (typeof IDS_BOTS)[number]);
const firma = { bot: IdBot.optional() };

export const ActividadIn = z
  .object({
    ...firma,
    tarea: texto(120),
    inicio: instante,
    fin: instante.optional(),
    resultado: z.enum(["ok", "fallo", "nada"]),
    nota: z.string().trim().max(2000).optional(),
    enlace: url.optional(),
  })
  .refine((a) => !a.fin || new Date(a.fin) >= new Date(a.inicio), { message: "fin anterior a inicio", path: ["fin"] });

export const BandejaIn = z.object({
  ...firma,
  tipo: z.enum(["aviso", "pregunta", "borrador"]),
  titulo: texto(200),
  cuerpo: z.string().trim().max(20000).optional(),
});

export const FiltroBandeja = z.enum(["nuevo", "leido", "respondido"]);

export const IdeaIn = z.object({
  ...firma,
  titulo: texto(200),
  gancho: texto(1000),
  formato: texto(200).optional(),
  por_que_funciona: texto(2000).optional(),
  referencias: z.array(url).max(20).default([]),
  trabajo_sugerido: texto(1000).optional(),
});
export const FiltroIdea = z.enum(["nueva", "me_gusta", "descartada", "usada"]);

// Por ahora el Guionista ELSA trabaja solo desde ideas: el calendario sigue siendo del guionista del PC.
export const GuionIn = z.object({
  ...firma,
  idea_id: uuid,
  reemplaza_id: uuid.optional(),
  titulo: texto(200),
  gancho: texto(1000),
  planos: z.array(z.union([texto(2000), z.record(z.string(), z.unknown())])).min(1).max(100),
  textos_pantalla: z.array(z.object({ texto: texto(300), segundo: z.number().nonnegative().max(3600) })).max(100).default([]),
  duracion_s: z.number().int().positive().max(3600).optional(),
  tema: texto(200).optional(),
  tipo_gancho: texto(200).optional(),
  prueba: texto(1000).optional(),
  reglas_cumplidas: z.array(texto(40)).max(100).default([]),
  preguntas: z.array(texto(500)).max(30).default([]),
});
// El guion de un vídeo del panel con las respuestas de Jordi dentro, sin cabecera. Sin guion_md, solo da respuestas por recogidas.
export const VideoGuionIn = z
  .object({
    ...firma,
    guion_md: z.string().trim().min(1).max(50000).refine((md) => /^# Guion completo/m.test(md), { message: "tiene que llevar la sección «# Guion completo»" }).optional(),
    recogidas: z.array(z.object({ clave: z.string().regex(/^P\d+$/), respondida_en: instante })).max(50).default([]),
  })
  .refine((v) => !!v.guion_md || v.recogidas.length > 0, { message: "sin guion_md ni recogidas no hay nada que hacer", path: ["guion_md"] });

export const FiltroGuion = z.enum(["propuesto", "aprobado", "cambios", "descartado", "sustituido"]);

export const ReglaRevisada = z
  .object({
    clave: texto(40),
    estado: z.enum(["cumple", "no_cumple", "no_aplica"]),
    evidencia: z.string().trim().max(1000).optional(),
  })
  .refine((r) => r.estado !== "no_cumple" || !!r.evidencia, { message: "no_cumple necesita evidencia (segundo del vídeo o frase)", path: ["evidencia"] });

export const RevisionIn = z
  .object({
    ...firma,
    fase: z.enum(["guion", "corte", "acabado"]),
    video_id: z.string().regex(/^GE_\d{3,}$/, "código GE_000").optional(),
    guion_id: uuid.optional(),
    resultado: z.enum(["ok", "cambios"]),
    por_regla: z.array(ReglaRevisada).min(1).max(200),
    resumen: z.string().trim().max(2000).optional(),
  })
  .refine((r) => (r.fase === "guion" ? !!r.guion_id && !r.video_id : !!r.video_id && !r.guion_id), {
    message: "fase guion lleva guion_id; corte y acabado llevan video_id",
    path: ["fase"],
  })
  .refine((r) => r.resultado === "cambios" || r.por_regla.every((x) => x.estado !== "no_cumple"), {
    message: "si una regla no se cumple, el resultado es cambios",
    path: ["resultado"],
  });

export const MemoriaIn = z.object({
  ...firma,
  clave: texto(120),
  contenido: texto(5000),
  tipo: z.enum(["hecho", "preferencia", "decision"]),
});
export const FiltroMemoria = z.enum(["hecho", "preferencia", "decision"]);

export const FiltroAgente = z.enum(["guionista", "archivador", "observador", "montador", "analista", "coordinador"]);

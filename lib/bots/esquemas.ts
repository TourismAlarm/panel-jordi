import { z } from "zod";
import { CATEGORIAS } from "@/lib/documentos/categorias";
import { FichaDatos } from "@/lib/documentos/contrato";
import { CorreoIn, EventoIn, tocaElDia } from "@/lib/hoy/contexto";
import { enlaceValido } from "@/lib/hoy/prioridades";
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
  tipo: z.enum(["hecho", "preferencia", "decision", "skill", "problema"]),
});
export const FiltroMemoria = z.enum(["hecho", "preferencia", "decision", "skill", "problema"]);

// Lo que escribe Antonio para el PC. Sin cortes, el montador los decide viendo el material y lo dice en sus notas.
const segundos = z.number().min(0).max(3600);
const InstruccionesIn = z.object({
  duracion_objetivo_s: z.number().int().min(1).max(600),
  cortes: z
    .array(
      z.object({
        archivo: z.string().trim().regex(/^[\w .()-]{1,120}\.[A-Za-z0-9]{2,5}$/, "nombre de archivo, sin carpetas"),
        desde: z.string().regex(/^\d{1,3}:\d{2}(\.\d{1,3})?$/, "mm:ss o mm:ss.d"),
        hasta: z.string().regex(/^\d{1,3}:\d{2}(\.\d{1,3})?$/, "mm:ss o mm:ss.d"),
        velocidad: z.number().min(0.25).max(30).default(1),
        nota: z.string().trim().max(300).optional(),
      }),
    )
    .max(200)
    .default([]),
  subtitulos: z.object({ idioma: z.enum(["ca", "es"]), estilo: z.string().trim().max(200).default("sistema/estilo-video.md") }),
  textos_pantalla: z.array(z.object({ texto: texto(120), desde_s: segundos, hasta_s: segundos, posicion: z.enum(["arriba", "centro", "abajo"]).default("centro") })).max(50).default([]),
  onomatopeyas: z.array(z.object({ texto: texto(40), segundo: segundos })).max(50).default([]),
  transiciones: z.array(z.object({ segundo: segundos, tipo: z.enum(["corte_seco", "fundido", "zoom"]) })).max(100).default([]),
  audio: texto(300),
  notas: z.string().trim().max(3000).optional(),
});

const FASE_ENCARGO = z.enum(["corte", "acabado"]);
const codigoVideo = z.string().regex(/^GE_\d{3,}$/, "código GE_000");

export const EncargoIn = z
  .object({
    video_id: codigoVideo,
    fase: FASE_ENCARGO,
    reemplaza_id: uuid.optional(),
    feedback: z.string().trim().max(3000).optional(),
    brutos: z.array(texto(500)).max(200).default([]),
    guion_md: z.string().trim().min(1).max(50000).optional(),
    instrucciones: InstruccionesIn,
  })
  .refine((e) => !e.reemplaza_id || !!e.feedback, { message: "una versión nueva dice qué cambia", path: ["feedback"] });

export const FiltroEncargo = z.enum(["pendiente", "en_curso", "listo", "aprobado", "cambios", "sustituido", "bloqueado", "fallido"]);

export const ResponderEncargoIn = z.object({ respuestas: z.array(z.object({ n: z.number().int().min(1), respuesta: texto(2000) })).min(1).max(50) });

// Lo que devuelve el PC. `final` = ya copió a FINAL/ lo que Jordi aprobó.
export const InformarIn = z.discriminatedUnion("estado", [
  z.object({ estado: z.literal("listo"), resultado_url: url, notas: z.string().trim().max(5000).optional(), duracion_real_s: z.number().min(0).max(3600) }),
  z.object({ estado: z.literal("bloqueado"), preguntas: z.array(texto(500)).min(1).max(20), notas: z.string().trim().max(5000).optional() }),
  z.object({ estado: z.literal("fallido"), error: texto(2000), notas: z.string().trim().max(5000).optional() }),
  z.object({ estado: z.literal("final"), resultado_url: url }),
]);

// Lo que Jordi pide en el panel y cierra Antonio: descartar, guion nuevo, material subido, revisión sin encargo.
export const FiltroPeticion = z.enum(["pendiente", "procesando", "hecha", "fallida"]);
export const PeticionCambioIn = z.discriminatedUnion("estado", [
  z.object({ estado: z.literal("procesando") }),
  z.object({ estado: z.literal("hecha") }),
  z.object({ estado: z.literal("fallida"), error: texto(500) }),
]);

// Cifras de redes que deja Antonio: los mismos campos que daba Windsor, que es lo que el panel sabe leer.
const cifra = z.number().min(0).nullish();
const proporcion = z.number().min(0).max(1).nullish();
const leyenda = z.string().max(5000).nullish();
const ReelInstagram = z.looseObject({
  timestamp: texto(40),
  media_permalink: url,
  media_caption: leyenda,
  media_views: cifra,
  media_reach: cifra,
  media_reel_avg_watch_time: cifra, // ms
  media_reel_skip_rate: proporcion,
  media_saved: cifra,
  media_shares: cifra,
});
const VideoTikTokIn = z.looseObject({
  video_id: z.string().regex(/^\d{5,25}$/),
  video_create_datetime: texto(40),
  video_caption: leyenda,
  video_share_url: url.nullish(),
  video_views_count: cifra,
  video_reach: cifra,
  video_average_time_watched: cifra, // s
  video_full_watched_rate: proporcion,
  video_favorites: cifra,
  video_shares: cifra,
  video_duration: cifra,
  video_new_followers: cifra,
});
export const FotoRedesIn = z.discriminatedUnion("red", [
  z.object({ red: z.literal("instagram"), fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), datos: z.array(ReelInstagram).min(1).max(500) }),
  z.object({ red: z.literal("tiktok"), fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), datos: z.array(VideoTikTokIn).min(1).max(500) }),
]);
const textoCorto = z.string().trim().max(300).nullish();
export const ReelsRedesIn = z.object({
  items: z
    .array(
      z.object({
        permalink: url,
        ge: z.string().regex(/^GE_\d{3,}$/).nullish(),
        tema: textoCorto,
        gancho: textoCorto,
        tipo_gancho: z.string().trim().max(60).nullish(),
        prueba: z.string().trim().max(40).nullish(),
        duracion_s: z.number().min(0).max(3600).nullish(),
        elsa: z.boolean().default(true),
      }),
    )
    .min(1)
    .max(200),
});
// semana «apuestas» = la lista de lo que se está probando (apuestas.md); las demás, un informe del analista.
export const InformeRedesIn = z.object({ semana: z.string().trim().regex(/^[\w-]{1,60}$/), titulo: texto(200), fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), markdown: texto(50000) });

export const FiltroAgente = z.enum(["guionista", "archivador", "observador", "montador", "analista", "coordinador", "ideas", "antonio"]);

// Antonio cambia las reglas con un porqué: es lo que Jordi lee en Aprende antes de decidir si lo deshace.
export const ReglaIn = z.object({ agente: FiltroAgente, regla: texto(600), por_que: texto(1000), evidencia: texto(1000), medida: texto(600).optional() });
export const ReglaCambioIn = z.object({ regla: texto(600), por_que: texto(1000) });
export const ReglaRetirarIn = z.object({ por_que: texto(1000) });

// Bots de vida: dinero, salud y documentos se leen; solo se escriben informes, el resumen de Hoy y las fichas.
export const FechaIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((f) => !Number.isNaN(Date.parse(`${f}T00:00:00Z`)) && new Date(`${f}T00:00:00Z`).toISOString().startsWith(f), "fecha no válida");
export const FiltroTipoMovimiento = z.enum(["income", "expense"]);
export const FiltroEstadoDocumento = z.enum(["pendiente", "procesado", "error", "nota"]);
export const FiltroCategoriaDocumento = z.enum(CATEGORIAS);
export const FiltroMes = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

export const ResumenHoyIn = z.object({
  ...firma,
  fecha: FechaIso,
  resumen: texto(4000),
  prioridades: z.array(z.object({ nivel: z.enum(["urgente", "importante", "futuro"]), texto: texto(300), enlace: z.string().max(1000).refine(enlaceValido, "una ruta del panel o una web https").optional() })).max(20).default([]),
  senales: z.record(z.string(), z.unknown()).optional(),
});

export const InformeIn = z
  .object({
    ...firma,
    tipo: texto(60),
    periodo_desde: FechaIso.optional(),
    periodo_hasta: FechaIso.optional(),
    titulo: texto(200),
    cuerpo_md: texto(20000),
    datos: z.record(z.string(), z.unknown()).default({}),
  })
  .refine((i) => !i.periodo_desde || !i.periodo_hasta || i.periodo_desde <= i.periodo_hasta, { message: "periodo al revés", path: ["periodo_hasta"] });

export const FichaBotIn = FichaDatos.extend({
  ...firma,
  categoria: z.enum(CATEGORIAS),
  tipo: texto(80).nullish(),
  titular: texto(200).nullish(),
  resumen: texto(4000).nullish(),
});

// Agenda y selección de correo de un día. Bloque ausente: no se toca. []: revisado y vacío. null no vale.
export const ContextoHoyIn = z
  .object({
    ...firma,
    fecha: FechaIso,
    agenda: z.array(EventoIn).max(50).optional(),
    correos: z.array(CorreoIn).max(30).optional(),
  })
  .refine((c) => c.agenda !== undefined || c.correos !== undefined, { message: "falta agenda o correos" })
  .superRefine((c, ctx) => {
    c.agenda?.forEach((ev, i) => {
      if (!tocaElDia(ev, c.fecha)) ctx.addIssue({ code: "custom", path: ["agenda", i], message: "no cae en esa fecha (Europe/Madrid)" });
    });
  });

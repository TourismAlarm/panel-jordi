// El arnés de Antonio: de los datos del panel a lo que hay que hacer. Lógica pura (pruebas en arnes.test.ts).
// Nada se escribe a mano: cada pendiente sale de una tabla y enlaza a donde se puede comprobar.
import { diasHasta, inicioDiaMadrid } from "@/lib/fechas";
import { AGENTE_DE_BOT, AGENTES, enlaceChat, nombreAgente, type AgenteArnes } from "./agentes";

export type Quien = "agente" | "antonio" | "jordi";
export const ESTADOS_ABIERTOS = ["en_curso", "esperando_agente", "esperando_jordi"] as const;
export const ESTADOS_CERRADOS = ["hecha", "cancelada"] as const;
export type EstadoTarea = (typeof ESTADOS_ABIERTOS)[number] | (typeof ESTADOS_CERRADOS)[number];

const DIA_MS = 86_400_000;

// ── Tareas a medias (las escribe Antonio) ────────────────────
export type TareaFila = {
  id: string;
  titulo: string;
  agente: string;
  estado: string;
  paso_actual: string | null;
  falta: string | null;
  enlace: string | null;
  empezada_en: string;
  actualizado_en: string;
};
export type TareaVista = TareaFila & { quien: Quien; sin_tocar_24h: boolean };

export function quienDeTarea(t: Pick<TareaFila, "agente" | "estado">): Quien {
  if (t.estado === "esperando_jordi") return "jordi";
  return t.agente === "antonio" ? "antonio" : "agente";
}

// Lo que te espera a ti, arriba; después, lo más viejo. Hecha o cancelada: fuera.
export function tareasAbiertas(filas: TareaFila[], ahora: number): TareaVista[] {
  return filas
    .filter((t) => (ESTADOS_ABIERTOS as readonly string[]).includes(t.estado))
    .map((t) => ({ ...t, quien: quienDeTarea(t), sin_tocar_24h: ahora - new Date(t.actualizado_en).getTime() > DIA_MS }))
    .sort((a, b) => Number(b.quien === "jordi") - Number(a.quien === "jordi") || a.actualizado_en.localeCompare(b.actualizado_en));
}

// ── Rutinas (las escribe Antonio) ────────────────────────────
export type RutinaFila = {
  id: string;
  nombre: string;
  horario: string;
  ultima_ejecucion: string | null;
  resultado: string | null;
  proxima: string | null;
  nota: string | null;
  actualizado: string;
  activa?: boolean; // false = en pausa a propósito: sale, pero no cuenta como saltada
};
export type RutinaVista = RutinaFila & { atrasada: boolean };

// Una rutina cuya próxima ejecución pasó hace más de una hora y no ha vuelto a informar: se ha saltado.
export function rutinasVista(filas: RutinaFila[], ahora: number): RutinaVista[] {
  return filas
    .map((r) => ({ ...r, atrasada: r.activa !== false && !!r.proxima && new Date(r.proxima).getTime() < ahora - 3_600_000 }))
    .sort((a, b) => peso(b) - peso(a) || (a.proxima ?? "9").localeCompare(b.proxima ?? "9"));
}
// Fallo, después saltada, después las demás; las pausadas, al final.
const peso = (r: RutinaVista) => (r.activa === false ? -1 : r.resultado === "fallo" ? 2 : r.atrasada ? 1 : 0);

// ── Pendientes calculados con los datos del panel ────────────
export type Pendiente = {
  id: string;
  agente: AgenteArnes;
  que: string;
  detalle?: string;
  desde: string | null; // ISO; null = no se sabe
  quien: Quien;
  enlace: string;
};

export type DatosPanel = {
  ahora: number;
  hoy: string; // AAAA-MM-DD en Madrid
  horaMadrid: number;
  titulos: Record<string, string | null>; // id de vídeo → título
  preguntas: { video_id: string; respondida_en: string | null; recogida_en: string | null }[];
  sinMaterial: { id: string; actualizado_en: string }[];
  guiones: { id: string; titulo: string; estado: string; actualizado: string }[]; // propuesto o cambios
  ideasNuevas: { creado: string }[];
  encargos: { id: string; video_id: string; version: number; fase: string; estado: string; revisado_en: string | null; tomado_en: string | null; terminado_en: string | null; creado: string; error: string | null }[]; // listo, bloqueado, fallido, en_curso o pendiente
  porRevisarSinEncargo: { id: string; estado: string; montaje_url: string | null; actualizado_en: string }[]; // corte_listo / acabado_listo sin encargo listo
  montandoSinEncargo: { id: string; actualizado_en: string }[]; // «montando» sin ningún encargo abierto: estado desfasado
  peticiones: { id: string; tipo: string; video_id: string | null; estado: string; creada_en: string }[];
  redesUltima: string | null; // fecha de la última foto de Instagram
  informeRedes: string | null; // fecha del último informe del analista
  saludUltima: string | null; // fecha del último dato de salud
  resumenHoy: boolean;
  vencimientos: { id: string; nombre: string; vencimiento: string }[];
  documentosConError: { id: string; nombre: string; subido_en: string }[];
  fallos: { id: number; bot: string; tarea: string; creado: string; enlace: string | null }[]; // últimas 48 h
  // Categorías: movimientos sin categoría para los que el bot aún no ha propuesto nada, y propuestas que esperan a Jordi.
  finanzas?: { sinPropuesta: number; porDecidir: number } | null;
};

const TIPO_PETICION: Record<string, string> = {
  descartar: "Descartar el proyecto",
  nuevo: "Guion nuevo",
  aprobar: "Montaje aprobado",
  cambios: "Cambios en el montaje",
  corregir: "Corregir",
  material_listo: "Material subido",
  sin_guion: "Proyecto sin guion",
  corte_ok: "Corte OK",
};

const video = (d: DatosPanel, id: string) => (d.titulos[id] ? `${id} · ${d.titulos[id]}` : id);
const plural = (n: number, uno: string, varios = `${uno}s`) => `${n} ${n === 1 ? uno : varios}`;
const masViejo = (fechas: (string | null)[]) => fechas.filter((f): f is string => !!f).sort()[0] ?? null;

export function calcularPendientes(d: DatosPanel): Pendiente[] {
  const p: Pendiente[] = [];

  // Antonio: peticiones de Jordi sin cerrar.
  for (const x of d.peticiones) {
    p.push({
      id: `peticion-${x.id}`,
      agente: "antonio",
      que: `${TIPO_PETICION[x.tipo] ?? x.tipo}${x.video_id ? ` · ${video(d, x.video_id)}` : ""}`,
      detalle: x.estado === "procesando" ? "Recogida, sin cerrar" : "Sin recoger",
      desde: x.creada_en,
      quien: "antonio",
      enlace: x.video_id ? `/elsa/videos/${x.video_id}` : "/elsa",
    });
  }

  // Guionista: preguntas (las contestas tú; las recoge él) y guiones propuestos.
  const porVideo = new Map<string, { sinContestar: number; sinRecoger: string[] }>();
  for (const q of d.preguntas) {
    if (q.recogida_en) continue;
    const r = porVideo.get(q.video_id) ?? { sinContestar: 0, sinRecoger: [] };
    if (!q.respondida_en) r.sinContestar++;
    else r.sinRecoger.push(q.respondida_en);
    porVideo.set(q.video_id, r);
  }
  for (const [id, r] of porVideo) {
    if (r.sinContestar)
      p.push({ id: `preguntas-${id}`, agente: "guionista", que: `${plural(r.sinContestar, "pregunta")} sin contestar · ${video(d, id)}`, desde: null, quien: "jordi", enlace: `/elsa/videos/${id}#preguntas` });
    if (r.sinRecoger.length)
      p.push({ id: `recoger-${id}`, agente: "guionista", que: `${plural(r.sinRecoger.length, "respuesta")} sin recoger · ${video(d, id)}`, detalle: "Las tiene que pasar al guion", desde: masViejo(r.sinRecoger), quien: "agente", enlace: `/elsa/videos/${id}#preguntas` });
  }
  for (const g of d.guiones) {
    const propuesto = g.estado === "propuesto";
    p.push({ id: `guion-${g.id}`, agente: "guionista", que: `Guion «${g.titulo}»`, detalle: propuesto ? "Por aprobar" : "Le pediste cambios", desde: g.actualizado, quien: propuesto ? "jordi" : "agente", enlace: "/elsa" });
  }

  // Editor: encargos listos, bloqueados o fallidos, y vídeos a los que les falta el material.
  for (const e of d.encargos) {
    const que = `${video(d, e.video_id)} · ${e.fase} v${e.version}`;
    const enlace = `/elsa/videos/${e.video_id}#montaje`;
    if (e.estado === "listo") {
      // En cuanto el PC entrega, revisa Jordi: no espera a Antonio (su revisión es opcional).
      p.push({ id: `encargo-${e.id}`, agente: "editor", que, detalle: e.fase === "corte" ? "Corte listo: te toca revisarlo" : "Acabado listo: te toca aprobarlo", desde: e.terminado_en ?? e.creado, quien: "jordi", enlace });
    } else if (e.estado === "en_curso" || e.estado === "pendiente") {
      // Más de 2 h montándose o sin que nadie lo tome: algo se ha quedado colgado.
      const desde = e.estado === "en_curso" ? (e.tomado_en ?? e.creado) : e.creado;
      const horas = Math.floor((d.ahora - new Date(desde).getTime()) / 3_600_000);
      if (horas < 2) continue;
      p.push({ id: `encargo-${e.id}`, agente: "editor", que, detalle: e.estado === "en_curso" ? `Lleva ${horas} h montándose` : `Lleva ${horas} h en la cola sin que nadie lo tome`, desde, quien: "antonio", enlace });
    } else {
      p.push({ id: `encargo-${e.id}`, agente: "editor", que, detalle: `${e.estado === "bloqueado" ? "Bloqueado" : "Fallido"}${e.error ? `: ${e.error}` : ""}`, desde: e.terminado_en ?? e.creado, quien: "antonio", enlace });
    }
  }
  for (const v of d.porRevisarSinEncargo) {
    p.push({ id: `revisar-${v.id}`, agente: "editor", que: `${v.estado === "corte_listo" ? "Corte" : "Montaje"} por revisar · ${video(d, v.id)}`, detalle: v.montaje_url ? "Te toca revisarlo" : "Te toca revisarlo, pero no tiene enlace al montaje", desde: v.actualizado_en, quien: "jordi", enlace: `/elsa/videos/${v.id}#montaje` });
  }
  for (const v of d.montandoSinEncargo) {
    p.push({ id: `desfasado-${v.id}`, agente: "antonio", que: `${video(d, v.id)} dice «montando», pero no hay ningún encargo abierto`, detalle: "Estado desfasado: entrega el montaje o corrige el estado", desde: v.actualizado_en, quien: "antonio", enlace: `/elsa/videos/${v.id}` });
  }
  for (const v of d.sinMaterial) {
    p.push({ id: `material-${v.id}`, agente: "editor", que: `Sin material · ${video(d, v.id)}`, detalle: "Sube lo grabado y pulsa «Ya he subido todo»", desde: v.actualizado_en, quien: "jordi", enlace: `/elsa/videos/${v.id}#material` });
  }

  // Analista: cifras de redes y su informe semanal.
  const diasDesde = (fecha: string | null) => (fecha ? -diasHasta(fecha, d.hoy) : null);
  const redes = diasDesde(d.redesUltima);
  if (redes === null || redes > 2) {
    p.push({ id: "redes-cifras", agente: "analista", que: "Cifras de redes sin actualizar", detalle: redes === null ? "Aún no hay ninguna" : `La última es de hace ${plural(redes, "día")}`, desde: d.redesUltima, quien: "agente", enlace: "/elsa/redes" });
  }
  const informe = diasDesde(d.informeRedes);
  if (informe === null || informe > 8) {
    p.push({ id: "redes-informe", agente: "analista", que: "Informe semanal de redes", detalle: informe === null ? "Aún no hay ninguno" : `El último es de hace ${plural(informe, "día")}`, desde: d.informeRedes, quien: "agente", enlace: "/elsa/redes" });
  }

  // Ideas: las nuevas las decides tú.
  if (d.ideasNuevas.length) {
    p.push({ id: "ideas-nuevas", agente: "ideas", que: `${plural(d.ideasNuevas.length, "idea nueva", "ideas nuevas")} por decidir`, desde: masViejo(d.ideasNuevas.map((i) => i.creado)), quien: "jordi", enlace: "/elsa/ideas" });
  }

  // Día a día: el resumen de la mañana.
  if (!d.resumenHoy && d.horaMadrid >= 9) {
    p.push({ id: "dia-resumen", agente: "dia", que: "Resumen de hoy sin hacer", desde: inicioDiaMadrid(d.hoy), quien: "agente", enlace: "/" });
  }

  // Salud: días sin métricas (lo normal es tener las de ayer).
  const salud = diasDesde(d.saludUltima);
  if (salud === null || salud > 1) {
    p.push({ id: "salud-metricas", agente: "salud", que: salud === null ? "Sin métricas de salud" : `${plural(salud - 1, "día")} sin métricas de salud`, detalle: d.saludUltima ? `Último dato: ${d.saludUltima}` : undefined, desde: d.saludUltima, quien: "agente", enlace: "/salud" });
  }

  // Documentos: vencimientos (tuyos) y los que no se han podido leer (suyos).
  for (const v of d.vencimientos) {
    const dias = diasHasta(v.vencimiento, d.hoy);
    p.push({ id: `vence-${v.id}`, agente: "documentos", que: `${v.nombre}: ${dias < 0 ? "vencido" : dias === 0 ? "vence hoy" : `vence en ${plural(dias, "día")}`}`, desde: null, quien: "jordi", enlace: `/documentos/${v.id}` });
  }
  for (const x of d.documentosConError) {
    p.push({ id: `doc-error-${x.id}`, agente: "documentos", que: `${x.nombre}: no se ha podido leer`, desde: x.subido_en, quien: "agente", enlace: `/documentos/${x.id}` });
  }

  // Finanzas: lo que falta por proponer (suyo) y lo propuesto que espera el sí o el no de Jordi (tuyo).
  if (d.finanzas?.sinPropuesta) {
    p.push({ id: "fin-sin-propuesta", agente: "finanzas", que: `${plural(d.finanzas.sinPropuesta, "movimiento")} sin categoría y sin propuesta`, detalle: "Propón una categoría para cada comercio: Jordi decide", desde: null, quien: "agente", enlace: "/finanzas?tab=movements" });
  }
  if (d.finanzas?.porDecidir) {
    p.push({ id: "fin-por-decidir", agente: "finanzas", que: `${plural(d.finanzas.porDecidir, "categoría propuesta", "categorías propuestas")} por decidir`, desde: null, quien: "jordi", enlace: "/finanzas?ver=propuestas" });
  }

  // Fallos de los bots en las últimas 48 h, en el registro de Actividad.
  for (const f of d.fallos) {
    const agente = AGENTE_DE_BOT[f.bot] ?? "antonio";
    p.push({ id: `fallo-${f.id}`, agente, que: `Falló: ${f.tarea}`, desde: f.creado, quien: agente === "antonio" ? "antonio" : "agente", enlace: `/elsa/actividad/bots?bot=${f.bot}` });
  }

  return p;
}

// ── Por agente ───────────────────────────────────────────────
export type GrupoAgente = {
  agente: AgenteArnes;
  nombre: string;
  chat: string | null;
  congelado: boolean;
  a_medias: number;
  pendientes: Pendiente[];
};

export function ordenarPendientes(p: Pendiente[]): Pendiente[] {
  return [...p].sort((a, b) => Number(b.quien === "jordi") - Number(a.quien === "jordi") || (a.desde ?? "9").localeCompare(b.desde ?? "9"));
}

// Un grupo por agente, siempre en el mismo orden. Un agente marcado como `congelado` en agentes.ts sale sin pendientes (hoy, ninguno).
export function porAgente(pendientes: Pendiente[], tareas: TareaVista[]): GrupoAgente[] {
  return AGENTES.map((a) => {
    const congelado = (a as { congelado?: boolean }).congelado === true;
    return {
      agente: a.id,
      nombre: nombreAgente(a.id),
      chat: enlaceChat(a.id),
      congelado,
      a_medias: tareas.filter((t) => t.agente === a.id).length,
      pendientes: congelado ? [] : ordenarPendientes(pendientes.filter((p) => p.agente === a.id)),
    };
  });
}

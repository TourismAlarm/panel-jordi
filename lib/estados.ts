// Traduce los estados técnicos que sube el PC a palabras de Jordi y a un tono de color.
// Es el único sitio donde se decide qué significa cada estado: las pantallas solo lo pintan.

import type { Fila } from "@/lib/supabase/tipos";
import type { Tono } from "@/components/ui/tono";

export type Estado = { texto: string; tono: Tono };

// ── Vídeos ────────────────────────────────────────────────

const CERRADOS = /publicado|aprobado|exportado|archivado/;

export function videoCerrado(estado: string) {
  return CERRADOS.test(estado);
}

function textoCrudo(estado: string) {
  const t = estado.replaceAll("_", " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function estadoVideo(estado: string): Estado {
  if (estado === "revision_jordi") return { texto: "Te toca revisar", tono: "ojo" };
  if (/respuestas|pregunt/.test(estado)) return { texto: "Faltan tus respuestas", tono: "ojo" };
  if (/guion_listo/.test(estado) && /material/.test(estado)) return { texto: "Guion listo · falta grabar", tono: "info" };
  if (/material|grab/.test(estado)) return { texto: "Falta grabar", tono: "neutro" };
  if (/publicado/.test(estado)) return { texto: "Publicado", tono: "bien" };
  if (/aprobado|exportado/.test(estado)) return { texto: "Aprobado", tono: "bien" };
  if (/archivado/.test(estado)) return { texto: "Archivado", tono: "neutro" };
  if (/mont|observ|archiv|invent|render/.test(estado)) return { texto: "Montando", tono: "info" };
  return { texto: textoCrudo(estado), tono: "neutro" };
}

// En qué fase está el proyecto. Decide en qué bloque de la portada sale.
// grabar → hay que ir a grabarlo o subir lo grabado · guion → el guionista aún lo prepara
// montaje → ya hay material, se está montando o revisando · hecho → publicado/aprobado/archivado
export type Fase = "grabar" | "guion" | "montaje" | "hecho";

export function faseVideo(estado: string): Fase {
  if (videoCerrado(estado)) return "hecho";
  if (/material|grab/.test(estado)) return "grabar";
  if (/revision|mont|observ|archiv|invent|render|export/.test(estado)) return "montaje";
  return "guion";
}

// ── Preguntas ─────────────────────────────────────────────

type PreguntaEstado = Pick<Fila<"preguntas">, "respondida_en" | "recogida_en">;

// pendiente → la contestas tú · enviada → la recoge el PC · recogida → ya está en preguntas.md
export function fasePregunta(p: PreguntaEstado): "pendiente" | "enviada" | "recogida" {
  if (p.recogida_en) return "recogida";
  if (p.respondida_en) return "enviada";
  return "pendiente";
}

export function estadoPregunta(p: PreguntaEstado): Estado {
  const fase = fasePregunta(p);
  if (fase === "recogida") return { texto: "Recogida por el PC", tono: "bien" };
  if (fase === "enviada") return { texto: "Enviada · la recoge el PC", tono: "info" };
  return { texto: "Pendiente", tono: "ojo" };
}

// ── Agentes ───────────────────────────────────────────────

export function estadoResultado(resultado: string | null): Estado {
  if (resultado === "ok") return { texto: "Bien", tono: "bien" };
  if (resultado === "fallo" || resultado === "error" || resultado === "bloqueado") {
    return { texto: resultado === "bloqueado" ? "Bloqueado" : "Falló", tono: "mal" };
  }
  if (resultado === "correccion") return { texto: "Corrigiendo", tono: "ojo" };
  return { texto: resultado ? textoCrudo(resultado) : "Sin resultado", tono: "neutro" };
}

// ── Descartar un proyecto ─────────────────────────────────

export const MOTIVOS = {
  no_lo_hice: "No hice yo el trabajo",
  no_me_gusta: "No me gusta cómo está planteado",
  no_sirve: "Ya no me sirve",
  otro: "Otro motivo",
} as const;

export type Motivo = keyof typeof MOTIVOS;

export function esMotivo(m: string): m is Motivo {
  return Object.hasOwn(MOTIVOS, m);
}

export function textoMotivo(m: string | null) {
  return m && esMotivo(m) ? MOTIVOS[m] : "Descartado";
}

// ── Peticiones (lo que pides al PC) ───────────────────────

type PeticionEstado = Pick<Fila<"peticiones">, "estado" | "error">;

export function estadoPeticion(p: PeticionEstado): Estado {
  switch (p.estado) {
    case "hecha":
      return { texto: "Hecho", tono: "bien" };
    case "fallida":
      return { texto: `Falló: ${p.error ?? "sin detalle"}`, tono: "mal" };
    case "procesando":
      return { texto: "El PC lo está haciendo", tono: "info" };
    default:
      return { texto: "Esperando al PC", tono: "info" };
  }
}

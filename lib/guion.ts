// Lee el guion que sube el PC: la cabecera YAML (cuándo, dónde, camión…) y las secciones «# …».
// Así la app enseña la ficha del trabajo y el texto para leer sin tener que abrir todo el guion.

import { parse } from "yaml";

export type Ficha = {
  hora: string | null;
  franja: string | null;
  lugar: string | null;
  camion: string | null;
  trabajo: string | null;
  version: string | null;
  porConfirmar: string[];
};

export type SeccionGuion = { titulo: string; clave: string; md: string };

const VACIA: Ficha = { hora: null, franja: null, lugar: null, camion: null, trabajo: null, version: null, porConfirmar: [] };

function separar(md: string) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { cabecera: null, cuerpo: md };
  return { cabecera: m[1], cuerpo: md.slice(m[0].length) };
}

// «[municipio por confirmar]» → null · «Sant Vicenç [municipio exacto por confirmar]» → «Sant Vicenç (por confirmar)»
function limpiar(v: unknown): string | null {
  if (v == null || v === "") return null;
  const t = String(v).trim();
  if (/^\[[^\]]*\]$/.test(t)) return null;
  return t.replace(/\s*\[[^\]]*\]/g, " (por confirmar)").trim() || null;
}

export function fichaDeGuion(md: string | null): Ficha {
  if (!md) return VACIA;
  const { cabecera } = separar(md);
  if (!cabecera) return VACIA;
  let d: Record<string, unknown>;
  try {
    d = (parse(cabecera) as Record<string, unknown>) ?? {};
  } catch {
    return VACIA;
  }
  const lista = Array.isArray(d.datos_por_confirmar) ? d.datos_por_confirmar : [];
  return {
    hora: limpiar(d.hora),
    franja: limpiar(d.franja),
    lugar: limpiar(d.lugar),
    camion: limpiar(d.camion),
    trabajo: limpiar(d.trabajo),
    version: limpiar(d.version),
    porConfirmar: lista.map((x) => String(x).replace(/^\[|\]$/g, "")),
  };
}

// «Guion completo · lectura» → «guion completo lectura» (para buscar secciones sin líos de acentos)
function clave(titulo: string) {
  return titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function seccionesDeGuion(md: string | null): SeccionGuion[] {
  if (!md) return [];
  const { cuerpo } = separar(md);
  const partes = cuerpo.split(/^# (.+)$/m);
  const secciones: SeccionGuion[] = [];
  if (partes[0].trim()) secciones.push({ titulo: "Guion", clave: "guion", md: partes[0].trim() });
  for (let i = 1; i < partes.length; i += 2) {
    secciones.push({ titulo: partes[i].trim(), clave: clave(partes[i]), md: (partes[i + 1] ?? "").trim() });
  }
  return secciones;
}

// Las secciones que tienen sitio propio en la app. El resto se enseña plegado en la ficha.
export const SECCION = {
  lectura: "guion completo",
  indicaciones: "guion con anotaciones",
  notas: "notas para jordi",
} as const;

export function buscarSeccion(secciones: SeccionGuion[], empieza: string) {
  return secciones.find((s) => s.clave.startsWith(empieza)) ?? null;
}

export function esSeccionPropia(s: SeccionGuion) {
  return Object.values(SECCION).some((c) => s.clave.startsWith(c));
}

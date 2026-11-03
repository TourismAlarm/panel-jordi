// Datos de clientes que no pueden entrar en ideas y guiones ni salir hacia los bots.
// Pilla lo que tiene forma reconocible. Los nombres de persona no se pueden detectar así: eso sigue siendo cosa de quien revisa.
const PATRONES: { que: string; patron: RegExp }[] = [
  { que: "correo", patron: /[\w.+-]+@[\w-]+\.[\w.-]+/g },
  { que: "IBAN", patron: /\b[A-Z]{2}\d{2}(?:[ -]?[A-Z0-9]{4}){3,7}\b/g },
  { que: "DNI o CIF", patron: /\b(?:\d{8}[A-HJ-NP-TV-Z]|[A-HJ-NP-SUVW]\d{7}[0-9A-J])\b/g },
  { que: "teléfono", patron: /(?<![\d.,])(?:\+34[ .-]?|0034[ .-]?)?[6-9]\d{2}(?:[ .-]?\d{2,3}){2,3}(?![\d])/g },
  { que: "precio", patron: /\d[\d.,]*\s?(?:€|euros?\b|eur\b)|€\s?\d/gi },
  { que: "nº de presupuesto", patron: /\b(?:presupuesto|factura|albar[aá]n)\s*(?:n[º°.]?|num(?:ero)?\.?|número)?\s*[:#]?\s*\d+/gi },
  { que: "dirección", patron: /\b(?:c\/|calle|carrer|avda\.?|avenida|plaza|pla[çc]a)\s+[^\n,]{2,50},?\s*(?:n[º°.]?\s*)?\d+/gi },
];

// Qué datos de cliente hay en un texto (lista vacía si ninguno).
export function datosDeCliente(texto: string): string[] {
  return PATRONES.filter(({ patron }) => texto.search(new RegExp(patron.source, patron.flags.replace("g", ""))) >= 0).map((p) => p.que);
}

// Busca en todos los textos de un objeto. Los enlaces no se miran: sus números no son datos de nadie.
export function revisarDatos(datos: unknown, ruta = ""): { campo: string; datos: string[] }[] {
  if (typeof datos === "string") {
    if (/^https?:\/\/\S+$/.test(datos.trim())) return [];
    const hallados = datosDeCliente(datos);
    return hallados.length ? [{ campo: ruta, datos: hallados }] : [];
  }
  if (Array.isArray(datos)) return datos.flatMap((d, i) => revisarDatos(d, `${ruta}[${i}]`));
  if (datos && typeof datos === "object") return Object.entries(datos).flatMap(([k, v]) => revisarDatos(v, ruta ? `${ruta}.${k}` : k));
  return [];
}

// Para lo que sale hacia un bot: tacha lo reconocible y quita la cabecera del guion (lugar, camión, trabajo…).
export function tacharDatos(texto: string): string {
  return PATRONES.reduce((t, { patron }) => t.replace(patron, "[oculto]"), texto);
}

export function guionParaBot(md: string | null): string | null {
  return md === null ? null : tacharDatos(md.replace(/^﻿?---\r?\n[\s\S]*?\r?\n---\r?\n?/, ""));
}

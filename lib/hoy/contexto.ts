import { z } from "zod";
import { inicioDiaMadrid, sumarDias } from "@/lib/fechas";
import type { Correo, Evento } from "./senales";

// Agenda y selección de correo que publica Antonio para un día. El panel no consulta Google.
const texto = (max: number) => z.string().trim().min(1).max(max);
const instante = z.iso.datetime({ offset: true });
const dia = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

// Con hora: inicio (y fin) con zona u offset. Todo el día: días AAAA-MM-DD (fin incluido) o null; nunca una hora inventada.
export const EventoIn = z
  .object({
    titulo: texto(200),
    todoElDia: z.boolean(),
    inicio: z.string().nullish(),
    fin: z.string().nullish(),
    lugar: texto(200).nullish(),
    calendario: texto(80).nullish(),
  })
  .superRefine((e, ctx) => {
    const formato = e.todoElDia ? dia : instante;
    const nombre = e.todoElDia ? "AAAA-MM-DD" : "fecha y hora con zona (ISO con offset)";
    if (!e.todoElDia && !e.inicio) ctx.addIssue({ code: "custom", path: ["inicio"], message: "obligatorio si no es de todo el día" });
    for (const k of ["inicio", "fin"] as const) {
      if (e[k] != null && !formato.safeParse(e[k]).success) ctx.addIssue({ code: "custom", path: [k], message: nombre });
    }
    if (e.inicio && e.fin && formato.safeParse(e.inicio).success && formato.safeParse(e.fin).success) {
      const alReves = e.todoElDia ? e.fin < e.inicio : Date.parse(e.fin) < Date.parse(e.inicio);
      if (alReves) ctx.addIssue({ code: "custom", path: ["fin"], message: "fin anterior a inicio" });
    }
  })
  .transform((e): Evento => ({ titulo: e.titulo, inicio: e.inicio ?? null, fin: e.fin ?? null, todoElDia: e.todoElDia, lugar: e.lugar ?? null, calendario: e.calendario ?? null }));

// Una selección: no tiene por qué estar sin leer ni ser de hoy.
export const CorreoIn = z
  .object({
    de: texto(200),
    asunto: texto(300),
    resumen: texto(280).nullish(),
    fecha: instante.nullable(),
  })
  .transform((c): Correo => ({ de: c.de, asunto: c.asunto, resumen: c.resumen ?? null, fecha: c.fecha }));

// ¿El evento cae en ese día de Madrid? Por solapamiento: cuentan los nocturnos y los de varios días.
export function tocaElDia(e: Evento, fecha: string): boolean {
  if (e.todoElDia) return (e.inicio ?? fecha) <= fecha && fecha <= (e.fin ?? e.inicio ?? fecha);
  if (!e.inicio) return false;
  const desde = Date.parse(inicioDiaMadrid(fecha));
  const hasta = Date.parse(inicioDiaMadrid(sumarDias(fecha, 1)));
  const inicio = Date.parse(e.inicio);
  return e.fin ? inicio < hasta && Date.parse(e.fin) > desde : inicio >= desde && inicio < hasta;
}

// Lo guardado en la base, leído con cuidado: lo que no encaja se descarta en vez de romper la portada.
export function leerEventos(json: unknown): Evento[] {
  return Array.isArray(json) ? json.flatMap((x) => { const r = EventoIn.safeParse(x); return r.success ? [r.data] : []; }) : [];
}
export function leerCorreos(json: unknown): Correo[] {
  return Array.isArray(json) ? json.flatMap((x) => { const r = CorreoIn.safeParse(x); return r.success ? [r.data] : []; }) : [];
}

// Qué enseña cada bloque de Hoy: aún no ha llegado, llegó vacío o hay lista.
export type EstadoBloque = "no-disponible" | "vacio" | "lista";
export function estadoBloque(publicadoEn: string | null, items: unknown[]): EstadoBloque {
  if (!publicadoEn) return "no-disponible";
  return items.length ? "lista" : "vacio";
}

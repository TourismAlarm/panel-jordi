import { NextResponse } from "next/server";
import { sumarDias, aISODia, diasHasta } from "@/lib/fechas";
import { FechaIso } from "./esquemas";

// Lo común de los GET de los bots de vida: rango de fechas y páginas.
export const RANGO_MAX_DIAS = 400;
export const LIMITE_MAX = 500;

const fallo = (error: string) => ({ fallo: NextResponse.json({ error }, { status: 400 }) });

// ?desde=&hasta= — sin ellos, los últimos 30 días. Nunca más de 400.
export function leerRango(request: Request): { desde: string; hasta: string } | { fallo: Response } {
  const q = new URL(request.url).searchParams;
  const hasta = q.get("hasta") ?? aISODia();
  const desde = q.get("desde") ?? sumarDias(hasta, -30);
  if (!FechaIso.safeParse(desde).success || !FechaIso.safeParse(hasta).success) return fallo("fechas en formato AAAA-MM-DD");
  const dias = diasHasta(hasta, desde);
  if (dias < 0) return fallo("desde es posterior a hasta");
  if (dias > RANGO_MAX_DIAS) return fallo(`el rango máximo es de ${RANGO_MAX_DIAS} días`);
  return { desde, hasta };
}

// ?limite=&cursor= — el cursor es el `siguiente` de la respuesta anterior.
export function leerPagina(request: Request): { limite: number; inicio: number } | { fallo: Response } {
  const q = new URL(request.url).searchParams;
  const limite = Number(q.get("limite") ?? 100);
  const inicio = Number(q.get("cursor") ?? 0);
  if (!Number.isInteger(limite) || limite < 1 || limite > LIMITE_MAX) return fallo(`limite entre 1 y ${LIMITE_MAX}`);
  if (!Number.isInteger(inicio) || inicio < 0) return fallo("cursor no válido");
  return { limite, inicio };
}

// Se pide una fila de más para saber si hay otra página. Va con .range(inicio, inicio + limite).
export function pagina<T>(filas: T[], p: { limite: number; inicio: number }) {
  return { items: filas.slice(0, p.limite), siguiente: filas.length > p.limite ? String(p.inicio + p.limite) : null };
}

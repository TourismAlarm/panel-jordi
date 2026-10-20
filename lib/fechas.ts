// Fechas en hora de Madrid y formato es-ES. Las fechas «de calendario» (vencimientos, días) viajan como «AAAA-MM-DD».
export const ZONA = "Europe/Madrid";

const DIA = new Intl.DateTimeFormat("es-ES", { timeZone: ZONA, day: "numeric", month: "long", year: "numeric" });
const DIA_CORTO = new Intl.DateTimeFormat("es-ES", { timeZone: ZONA, day: "numeric", month: "short" });
const FECHA_HORA = new Intl.DateTimeFormat("es-ES", {
  timeZone: ZONA, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
});
const ISO_MADRID = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" });

const MS_DIA = 86_400_000;

// «AAAA-MM-DD» de hoy (o de la fecha dada) en Madrid.
export function aISODia(fecha: Date = new Date()): string {
  return ISO_MADRID.format(fecha);
}

function deISODia(iso: string): number {
  const [a, m, d] = iso.split("-").map(Number);
  return Date.UTC(a, m - 1, d);
}

export function formatearDia(iso: string): string {
  return DIA.format(new Date(deISODia(iso) + 12 * 3_600_000));
}

export function formatearDiaCorto(iso: string): string {
  return DIA_CORTO.format(new Date(deISODia(iso) + 12 * 3_600_000));
}

export function formatearFechaHora(fecha: Date | string): string {
  return FECHA_HORA.format(typeof fecha === "string" ? new Date(fecha) : fecha);
}

// Días naturales entre dos fechas «AAAA-MM-DD» (negativo si ya pasó).
export function diasHasta(iso: string, desde: string = aISODia()): number {
  return Math.round((deISODia(iso) - deISODia(desde)) / MS_DIA);
}

export function sumarDias(iso: string, dias: number): string {
  return new Date(deISODia(iso) + dias * MS_DIA).toISOString().slice(0, 10);
}

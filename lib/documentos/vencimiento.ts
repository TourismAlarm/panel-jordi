// Vencimientos: cuánto falta y cómo de urgente es. Lógica pura (pruebas en vencimiento.test.ts).
import { diasHasta } from "@/lib/fechas";

export type NivelVencimiento = "vencido" | "urgente" | "pronto" | "normal";

// vencido: ya pasó · urgente: 7 días o menos · pronto: menos de 30 días · normal: más
export function nivelVencimiento(fecha: string | null | undefined, hoy: string): { dias: number; nivel: NivelVencimiento } | null {
  if (!fecha) return null;
  const dias = diasHasta(fecha, hoy);
  const nivel: NivelVencimiento = dias < 0 ? "vencido" : dias <= 7 ? "urgente" : dias < 30 ? "pronto" : "normal";
  return { dias, nivel };
}

export function textoVencimiento(dias: number): string {
  if (dias < -1) return `Venció hace ${-dias} días`;
  if (dias === -1) return "Venció ayer";
  if (dias === 0) return "Vence hoy";
  if (dias === 1) return "Vence mañana";
  return `Vence en ${dias} días`;
}

// Índice maestro: primero lo que vence (lo vencido y lo más cercano arriba); los que no tienen fecha, al final por nombre.
export function ordenarPorVencimiento<T extends { vencimiento: string | null; nombre: string }>(docs: T[]): T[] {
  return [...docs].sort((a, b) => {
    if (a.vencimiento && b.vencimiento) return a.vencimiento.localeCompare(b.vencimiento) || a.nombre.localeCompare(b.nombre, "es");
    if (a.vencimiento) return -1;
    if (b.vencimiento) return 1;
    return a.nombre.localeCompare(b.nombre, "es");
  });
}

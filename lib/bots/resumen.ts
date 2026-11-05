import { aISODia, sumarDias } from "@/lib/fechas";
import { IDS_BOTS, type Bot } from "./catalogo";

// La «fábrica»: de un vistazo, cómo va cada bot. Lógica pura (pruebas en resumen.test.ts).
export type EjecucionBot = { id: number; bot: string; tarea: string; inicio: string; fin: string | null; resultado: string; nota: string | null; enlace: string | null };
export type FiltroDia = "hoy" | "ayer" | "semana";

export function resumenBots(filas: EjecucionBot[], ahora = new Date()) {
  const desde = sumarDias(aISODia(ahora), -6);
  return IDS_BOTS.map((bot: Bot) => {
    const suyas = filas.filter((f) => f.bot === bot);
    return {
      bot,
      ultima: suyas.reduce<EjecucionBot | null>((m, f) => (!m || f.inicio > m.inicio ? f : m), null),
      fallos7d: suyas.filter((f) => f.resultado === "fallo" && aISODia(new Date(f.inicio)) >= desde).length,
    };
  });
}

export function filtrarEjecuciones(filas: EjecucionBot[], { bot, dia }: { bot?: string; dia?: FiltroDia }, ahora = new Date()) {
  const hoy = aISODia(ahora);
  const ayer = sumarDias(hoy, -1);
  const desde = sumarDias(hoy, -6);
  return filas.filter((f) => {
    if (bot && f.bot !== bot) return false;
    const d = aISODia(new Date(f.inicio));
    if (dia === "hoy") return d === hoy;
    if (dia === "ayer") return d === ayer;
    if (dia === "semana") return d >= desde;
    return true;
  });
}

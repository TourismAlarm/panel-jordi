import { describe, expect, it } from "vitest";
import { filtrarEjecuciones, resumenBots, type EjecucionBot } from "./resumen";

const ahora = new Date("2026-11-03T12:00:00Z");
const fila = (id: number, bot: string, inicio: string, resultado = "ok"): EjecucionBot => ({ id, bot, tarea: "t", inicio, fin: null, resultado, nota: null, enlace: null });

describe("resumen de bots", () => {
  it("salen todos los bots, también los que no han corrido", () => {
    const r = resumenBots([], ahora);
    expect(r.map((x) => x.bot)).toEqual(["antonio", "ideas", "guionista", "editor"]);
    expect(r[0].ultima).toBeNull();
  });
  it("coge la última ejecución y cuenta solo los fallos de 7 días", () => {
    const r = resumenBots(
      [fila(1, "ideas", "2026-11-03T08:00:00Z"), fila(2, "ideas", "2026-11-02T08:00:00Z", "fallo"), fila(3, "ideas", "2026-10-20T08:00:00Z", "fallo")],
      ahora,
    );
    const ideas = r.find((x) => x.bot === "ideas")!;
    expect(ideas.ultima?.id).toBe(1);
    expect(ideas.fallos7d).toBe(1);
  });
});

describe("filtro de ejecuciones", () => {
  const filas = [fila(1, "antonio", "2026-11-03T08:00:00Z"), fila(2, "ideas", "2026-11-02T08:00:00Z"), fila(3, "ideas", "2026-10-01T08:00:00Z")];
  it("por bot", () => {
    expect(filtrarEjecuciones(filas, { bot: "ideas" }, ahora).map((f) => f.id)).toEqual([2, 3]);
  });
  it("por día", () => {
    expect(filtrarEjecuciones(filas, { dia: "hoy" }, ahora).map((f) => f.id)).toEqual([1]);
    expect(filtrarEjecuciones(filas, { dia: "ayer" }, ahora).map((f) => f.id)).toEqual([2]);
    expect(filtrarEjecuciones(filas, { dia: "semana" }, ahora).map((f) => f.id)).toEqual([1, 2]);
  });
  it("el día va en hora de Madrid", () => {
    const noche = [fila(9, "ideas", "2026-11-02T23:30:00Z")]; // 00:30 del día 3 en Madrid
    expect(filtrarEjecuciones(noche, { dia: "hoy" }, ahora).map((f) => f.id)).toEqual([9]);
  });
});

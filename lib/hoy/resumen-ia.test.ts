import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { EsquemaResumen, resumenSinIA } from "./resumen-ia";
import type { Foto } from "./reunir";

const foto: Foto = {
  fecha: "2026-10-21", eventos: [], correos: [], google: "sin-conectar", fallos: ["Salud"], salud: [],
  senales: [
    { id: "a", modulo: "elsa", nivel: "urgente", titulo: "Subir lo grabado" },
    { id: "b", modulo: "finanzas", nivel: "hoy", titulo: "Cuota del coche" },
    { id: "c", modulo: "salud", nivel: "saber", titulo: "Dormiste 7 h" },
  ],
};

describe("resumen del día", () => {
  it("sin IA sigue funcionando y dice lo que falla", () => {
    const r = resumenSinIA(foto);
    expect(r.conIA).toBe(false);
    expect(r.resumen).toContain("Urgente: Subir lo grabado");
    expect(r.resumen).toContain("No se ha podido leer: Salud");
    expect(r.prioridades).toEqual(["Subir lo grabado", "Cuota del coche"]);
  });
  it("el esquema rechaza más de 5 prioridades", () => {
    expect(EsquemaResumen.safeParse({ resumen: "x", prioridades: ["1", "2", "3", "4", "5", "6"] }).success).toBe(false);
  });
});

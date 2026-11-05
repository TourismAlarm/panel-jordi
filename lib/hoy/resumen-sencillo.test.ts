import { describe, expect, it } from "vitest";
import { resumenSencillo } from "./resumen-sencillo";
import type { Foto } from "./reunir";

const foto: Foto = {
  fecha: "2026-10-21", eventos: [], correos: [], google: "sin-conectar", fallos: ["Salud"], salud: [],
  senales: [
    { id: "a", modulo: "elsa", nivel: "urgente", titulo: "Subir lo grabado" },
    { id: "b", modulo: "finanzas", nivel: "hoy", titulo: "Cuota del coche" },
    { id: "c", modulo: "salud", nivel: "saber", titulo: "Dormiste 7 h" },
  ],
};

describe("resumen sencillo del día", () => {
  it("ordena las señales y dice lo que falla", () => {
    const r = resumenSencillo(foto);
    expect(r.resumen).toContain("Urgente: Subir lo grabado");
    expect(r.resumen).toContain("No se ha podido leer: Salud");
    expect(r.prioridades).toEqual(["Subir lo grabado", "Cuota del coche"]);
  });
  it("sin nada pendiente lo dice", () => {
    expect(resumenSencillo({ ...foto, senales: [], fallos: [] }).resumen).toBe("Nada urgente.");
  });
});

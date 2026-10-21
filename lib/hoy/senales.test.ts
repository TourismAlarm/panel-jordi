import { describe, expect, it } from "vitest";
import { ordenar, senalesBandeja, senalesElsa, senalesFinanzas, senalesSalud } from "./senales";

const hoy = "2026-10-21";
const ahora = new Date("2026-10-21T08:00:00Z").getTime();

describe("senalesElsa", () => {
  it("lo de hoy o atrasado es urgente; lo lejano, solo para saber", () => {
    const s = senalesElsa({
      hoy, ahora, reglasPorDecidir: 0, pcUltimoOk: "2026-10-21T07:50:00Z",
      proyectos: [
        { id: "a", titulo: "A", fecha_trabajo: "2026-10-20", pasoTuyo: "Subir lo grabado" },
        { id: "b", titulo: "B", fecha_trabajo: "2026-10-22", pasoTuyo: "Contestar" },
        { id: "c", titulo: "C", fecha_trabajo: "2026-11-10", pasoTuyo: "Contestar" },
      ],
    });
    expect(s.map((x) => x.nivel)).toEqual(["urgente", "hoy", "saber"]);
  });
  it("avisa si el PC lleva más de 12 h sin sincronizar", () => {
    const s = senalesElsa({ hoy, ahora, proyectos: [], reglasPorDecidir: 2, pcUltimoOk: "2026-10-20T10:00:00Z" });
    expect(s.map((x) => x.id)).toEqual(["elsa-reglas", "elsa-pc"]);
  });
});

describe("senalesFinanzas", () => {
  const base = { hoy, enlaces: [], prestamos: [], sinCategoria: 0, restante: null, porDia: null, diasNomina: null };
  it("conexión caducada = hoy; a punto de caducar = saber", () => {
    const s = senalesFinanzas({ ...base, enlaces: [
      { banco: "BBVA", estado: "expired", valido_hasta: null, error: null },
      { banco: "Revolut", estado: "active", valido_hasta: "2026-10-25T00:00:00Z", error: null },
      { banco: "TR", estado: "active", valido_hasta: "2027-01-01T00:00:00Z", error: null },
    ] });
    expect(s.map((x) => [x.id, x.nivel])).toEqual([["fin-banco-BBVA", "hoy"], ["fin-banco-Revolut", "saber"]]);
  });
  it("cuota en 0-3 días", () => {
    const s = senalesFinanzas({ ...base, prestamos: [{ nombre: "Coche", importe: 250, dia: 21 }, { nombre: "Piso", importe: 100, dia: 23 }, { nombre: "Lejos", importe: 1, dia: 30 }] });
    expect(s.map((x) => [x.id, x.nivel])).toEqual([["fin-cuota-Coche", "urgente"], ["fin-cuota-Piso", "hoy"]]);
  });
  it("saldo negativo es urgente", () => {
    const s = senalesFinanzas({ ...base, restante: -20, porDia: -2, diasNomina: 10 });
    expect(s[0].nivel).toBe("urgente");
  });
});

describe("senalesSalud", () => {
  it("el aviso médico es urgente", () => {
    expect(senalesSalud({ hoy, ultimoDato: hoy, lineas: [], avisoMedico: true })[0].nivel).toBe("urgente");
  });
  it("avisa de datos viejos, no de resumen", () => {
    const s = senalesSalud({ hoy, ultimoDato: "2026-10-17", lineas: ["x"], avisoMedico: false });
    expect(s.map((x) => x.id)).toEqual(["sal-viejo"]);
  });
  it("sin datos nunca: no inventa nada", () => {
    expect(senalesSalud({ hoy, ultimoDato: null, lineas: [], avisoMedico: false })).toEqual([]);
  });
});

describe("ordenar", () => {
  it("urgente primero, luego hoy, luego saber", () => {
    const o = ordenar([...senalesBandeja(1), ...senalesSalud({ hoy, ultimoDato: hoy, lineas: ["Dormiste bien"], avisoMedico: false }), ...senalesFinanzas({ hoy, enlaces: [], prestamos: [{ nombre: "X", importe: 1, dia: 21 }], sinCategoria: 0, restante: null, porDia: null, diasNomina: null })]);
    expect(o.map((x) => x.nivel)).toEqual(["urgente", "hoy", "saber"]);
  });
});

import { describe, expect, it } from "vitest";
import { nivelVencimiento, ordenarPorVencimiento, textoVencimiento } from "./vencimiento";

const hoy = "2026-10-21";

describe("nivelVencimiento", () => {
  it("sin fecha no hay nivel", () => expect(nivelVencimiento(null, hoy)).toBeNull());
  it.each([
    ["2026-10-20", "vencido"],
    ["2026-10-21", "urgente"],
    ["2026-10-28", "urgente"],
    ["2026-10-29", "pronto"],
    ["2026-11-19", "pronto"],
    ["2026-11-20", "normal"],
  ])("%s → %s", (f, n) => expect(nivelVencimiento(f, hoy)?.nivel).toBe(n));
  it("los textos", () => {
    expect(textoVencimiento(0)).toBe("Vence hoy");
    expect(textoVencimiento(1)).toBe("Vence mañana");
    expect(textoVencimiento(12)).toBe("Vence en 12 días");
    expect(textoVencimiento(-3)).toBe("Venció hace 3 días");
  });
});

describe("ordenarPorVencimiento", () => {
  it("lo que vence primero, sin fecha al final", () => {
    const o = ordenarPorVencimiento([
      { nombre: "B", vencimiento: null },
      { nombre: "A", vencimiento: "2027-01-01" },
      { nombre: "C", vencimiento: "2026-10-01" },
    ]);
    expect(o.map((x) => x.nombre)).toEqual(["C", "A", "B"]);
  });
});

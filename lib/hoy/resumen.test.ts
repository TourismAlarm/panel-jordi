import { describe, expect, it } from "vitest";
import { CuerpoResumen } from "./resumen";

describe("contrato del resumen de Claude", () => {
  it("acepta solo el resumen", () => {
    expect(CuerpoResumen.parse({ resumen: "Buen día" })).toEqual({ resumen: "Buen día", prioridades: [], agenda: [], correos: [] });
  });
  it("rechaza resumen vacío o más de 5 prioridades", () => {
    expect(CuerpoResumen.safeParse({ resumen: "  " }).success).toBe(false);
    expect(CuerpoResumen.safeParse({ resumen: "x", prioridades: ["1", "2", "3", "4", "5", "6"] }).success).toBe(false);
  });
  it("rechaza textos desmesurados", () => {
    expect(CuerpoResumen.safeParse({ resumen: "x".repeat(901) }).success).toBe(false);
  });
});

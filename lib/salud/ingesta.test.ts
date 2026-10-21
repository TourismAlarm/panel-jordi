import { describe, expect, it } from "vitest";
import { CuerpoIngesta } from "./ingesta";

describe("contrato de ingesta de salud", () => {
  it("acepta métricas y entrenos válidos y rellena la fuente", () => {
    const r = CuerpoIngesta.parse({
      metricas: [{ fecha: "2026-10-20", metrica: "sueno_horas", valor: 7.2 }],
      entrenos: [{ fecha: "2026-10-20", tipo: "correr", duracion_min: 40, id_externo: "g123" }],
    });
    expect(r.metricas[0].fuente).toBe("garmin");
    expect(r.entrenos[0].fuente).toBe("garmin");
  });
  it("rechaza métricas desconocidas, fechas mal escritas y valores no numéricos", () => {
    expect(CuerpoIngesta.safeParse({ metricas: [{ fecha: "2026-10-20", metrica: "colesterol", valor: 1 }] }).success).toBe(false);
    expect(CuerpoIngesta.safeParse({ metricas: [{ fecha: "20/10/2026", metrica: "pasos", valor: 1 }] }).success).toBe(false);
    expect(CuerpoIngesta.safeParse({ metricas: [{ fecha: "2026-10-20", metrica: "pasos", valor: "muchos" }] }).success).toBe(false);
  });
  it("la fuente «manual» está reservada al panel", () => {
    expect(CuerpoIngesta.safeParse({ metricas: [{ fecha: "2026-10-20", metrica: "peso_kg", valor: 80, fuente: "manual" }] }).success).toBe(false);
  });
  it("un entreno sin id_externo se rechaza (si no, cada envío lo duplicaría)", () => {
    expect(CuerpoIngesta.safeParse({ entrenos: [{ fecha: "2026-10-20", tipo: "correr" }] }).success).toBe(false);
  });
  it("un envío vacío se rechaza", () => {
    expect(CuerpoIngesta.safeParse({}).success).toBe(false);
  });
});

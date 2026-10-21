import { describe, expect, it } from "vitest";
import { queFalta } from "./falta";

describe("¿qué me falta?", () => {
  it("un vehículo sin seguro ni ITV", () => {
    const f = queFalta([{ categoria: "Vehículos y maquinaria", tipo: "Permiso de circulación", nombre: "permiso furgoneta" }]);
    expect(f).toContain("Seguro del vehículo (póliza y último recibo)");
    expect(f).toContain("ITV");
    expect(f).not.toContain("Permiso de circulación");
  });
  it("no sugiere nada sin documentos de ese tema", () => {
    expect(queFalta([{ categoria: "Notas", tipo: "nota", nombre: "recordatorio" }])).toEqual([]);
  });
  it("lo que ya está no se pide", () => {
    const f = queFalta([
      { categoria: "Vehículos y maquinaria", tipo: "Seguro", nombre: "póliza coche" },
      { categoria: "Vehículos y maquinaria", tipo: "ITV", nombre: "itv 2026" },
      { categoria: "Vehículos y maquinaria", tipo: "Permiso de circulación", nombre: "pc" },
      { categoria: "Vehículos y maquinaria", tipo: "Ficha técnica", nombre: "ft" },
    ]);
    expect(f).toEqual(["Último recibo pagado del seguro"]);
  });
});

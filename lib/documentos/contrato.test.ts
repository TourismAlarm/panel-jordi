import { describe, expect, it } from "vitest";
import { CuerpoResultado, ultimos4 } from "./contrato";

const id = "11111111-1111-4111-8111-111111111111";

describe("ultimos4", () => {
  it("solo los últimos 4", () => {
    expect(ultimos4("ES91 2100 0418 4502 0005 1332")).toBe("···1332");
    expect(ultimos4("POL-2026/123456")).toBe("···3456");
  });
  it("sin dato", () => {
    expect(ultimos4("no especificado")).toBeNull();
    expect(ultimos4("")).toBeNull();
    expect(ultimos4(null)).toBeNull();
  });
});

describe("contrato del resultado de Claude", () => {
  it("«no especificado» queda sin dato, no se inventa", () => {
    const r = CuerpoResultado.parse({ id, categoria: "Seguros", tipo: "no especificado", ficha: { vencimiento: "no especificado", contacto: "No especificado" } });
    expect(r.tipo).toBeNull();
    expect(r.ficha.vencimiento).toBeNull();
    expect(r.ficha.contacto).toBeNull();
  });
  it("máximo 3 condiciones y fechas AAAA-MM-DD", () => {
    expect(CuerpoResultado.safeParse({ id, categoria: "Seguros", ficha: { condiciones: ["a", "b", "c", "d"] } }).success).toBe(false);
    expect(CuerpoResultado.safeParse({ id, categoria: "Seguros", ficha: { vencimiento: "31/12/2026" } }).success).toBe(false);
    expect(CuerpoResultado.safeParse({ id, categoria: "Seguros", ficha: { vencimiento: "2026-12-31" } }).success).toBe(true);
  });
  it("categoría fuera de la lista, no", () => {
    expect(CuerpoResultado.safeParse({ id, categoria: "Otra" }).success).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { aCentimos, formatearEuros, sumarEuros } from "./dinero";

describe("dinero", () => {
  it("suma sin error de coma flotante", () => {
    expect(0.1 + 0.2).not.toBe(0.3);
    expect(sumarEuros([0.1, 0.2])).toBe(0.3);
  });
  it("pasa a céntimos enteros", () => {
    expect(aCentimos(19.99)).toBe(1999);
  });
  it("formatea en euros es-ES", () => {
    expect(formatearEuros(1234.5).replace(/\s/g, " ")).toBe("1234,50 €");
    expect(formatearEuros(1234.5, { sinDecimales: true }).replace(/\s/g, " ")).toBe("1235 €");
  });
});

import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { cifrar, claveDeToken, descifrar } from "./cifrado";

const clave = claveDeToken("a".repeat(64));

describe("cifrado del token de Google", () => {
  it("ida y vuelta", () => {
    expect(descifrar(cifrar("1//refresh-token", clave), clave)).toBe("1//refresh-token");
  });
  it("no repite el mismo cifrado y no contiene el texto", () => {
    const a = cifrar("secreto", clave);
    expect(a).not.toBe(cifrar("secreto", clave));
    expect(a).not.toContain("secreto");
  });
  it("con otra clave o manipulado, falla", () => {
    const c = cifrar("x", clave);
    expect(() => descifrar(c, claveDeToken("b".repeat(64)))).toThrow();
    expect(() => descifrar(c.slice(0, -2) + "AA", clave)).toThrow();
  });
  it("rechaza claves de longitud incorrecta", () => {
    expect(() => claveDeToken("corta")).toThrow();
  });
});

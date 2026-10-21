import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { esEscaneo, textoParaIA } from "./leer";

describe("lectura de documentos", () => {
  it("un PDF casi sin texto es un escaneo", () => {
    expect(esEscaneo([])).toBe(true);
    expect(esEscaneo(["", "  "])).toBe(true);
    expect(esEscaneo(["a".repeat(500), "b".repeat(300)])).toBe(false);
  });
  it("el texto para la IA marca las páginas y se corta al llegar al máximo", () => {
    const t = textoParaIA(["uno", "dos"]);
    expect(t).toContain("--- Página 1 ---\nuno");
    expect(t).toContain("--- Página 2 ---\ndos");
    const largo = textoParaIA(Array.from({ length: 10 }, () => "x".repeat(20_000)));
    expect(largo.length).toBeLessThan(65_000);
    expect(largo).not.toContain("Página 5");
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { correoPermitido } from "./acceso";

describe("correoPermitido", () => {
  afterEach(() => {
    delete process.env.ALLOWED_EMAIL;
  });
  it("nadie entra si ALLOWED_EMAIL falta", () => {
    expect(correoPermitido("basecero5@gmail.com")).toBe(false);
  });
  it("solo entra el correo permitido (sin importar mayúsculas)", () => {
    process.env.ALLOWED_EMAIL = "basecero5@gmail.com";
    expect(correoPermitido("BaseCero5@gmail.com")).toBe(true);
    expect(correoPermitido("otro@gmail.com")).toBe(false);
    expect(correoPermitido(null)).toBe(false);
  });
});

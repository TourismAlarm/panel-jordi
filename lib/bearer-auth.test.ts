import { afterEach, describe, expect, it } from "vitest";
import { bearerNoAutorizado } from "./bearer-auth";

const pedir = (auth?: string) => new Request("https://x.test/api/salud/ingesta", { headers: auth ? { authorization: auth } : {} });

describe("bearerNoAutorizado", () => {
  afterEach(() => {
    delete process.env.SALUD_INGESTA_SECRET;
  });
  it("sin secreto configurado (o corto) rechaza todo", () => {
    expect(bearerNoAutorizado(pedir("Bearer "), "SALUD_INGESTA_SECRET")?.status).toBe(401);
    process.env.SALUD_INGESTA_SECRET = "corto";
    expect(bearerNoAutorizado(pedir("Bearer corto"), "SALUD_INGESTA_SECRET")?.status).toBe(401);
  });
  it("solo acepta el secreto exacto", () => {
    process.env.SALUD_INGESTA_SECRET = "secreto-largo-de-prueba";
    expect(bearerNoAutorizado(pedir(), "SALUD_INGESTA_SECRET")?.status).toBe(401);
    expect(bearerNoAutorizado(pedir("Bearer otro-secreto-largo-xx"), "SALUD_INGESTA_SECRET")?.status).toBe(401);
    expect(bearerNoAutorizado(pedir("Bearer secreto-largo-de-prueba"), "SALUD_INGESTA_SECRET")).toBeNull();
  });
});

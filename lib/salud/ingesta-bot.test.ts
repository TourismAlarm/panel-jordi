import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/bots/salud/ingesta/route";

const guardado = vi.fn(async () => ({ metricas: 1, entrenos: { nuevos: 0, actualizados: 0 } }));
vi.mock("@/lib/salud/guardar-ingesta", () => ({ guardarIngesta: (d: unknown) => (guardado as (d: unknown) => unknown)(d) }));
vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ gte: async () => ({ count: 0, error: null }) }) }),
      insert: async () => ({ error: null }),
    }),
  }),
}));

const CLAVE = "clave-de-prueba-antonio-1234567890";
const llamar = (cuerpo: unknown, clave = CLAVE) => POST(new Request("https://panel.test/api/bots/salud/ingesta", { method: "POST", headers: { authorization: `Bearer ${clave}` }, body: JSON.stringify(cuerpo) }));
const metrica = { fecha: "2026-11-05", metrica: "pasos", valor: 8450 };

beforeEach(() => {
  guardado.mockClear();
  vi.stubEnv("BOTS_API_KEY_ANTONIO", CLAVE);
});
afterEach(() => vi.unstubAllEnvs());

describe("lo que Antonio trae de Garmin", () => {
  it("se guarda como garmin, firme quien firme el bot de Salud", async () => {
    const r = await llamar({ bot: "salud", metricas: [metrica] });
    expect(r.status).toBe(200);
    expect(guardado).toHaveBeenCalledWith({ metricas: [{ ...metrica, fuente: "garmin" }], entrenos: [] });
  });
  it("sin firmar también vale: lo firma Salud", async () => {
    expect((await llamar({ metricas: [metrica] })).status).toBe(200);
  });
  it("otro bot no puede, ni con la clave buena", async () => {
    expect((await llamar({ bot: "finanzas", metricas: [metrica] })).status).toBe(403);
    expect(guardado).not.toHaveBeenCalled();
  });
  it("un envío vacío o que se hace pasar por manual no entra", async () => {
    expect((await llamar({ bot: "salud" })).status).toBe(400);
    expect((await llamar({ bot: "salud", metricas: [{ ...metrica, fuente: "manual" }] })).status).toBe(400);
    expect(guardado).not.toHaveBeenCalled();
  });
  it("sin clave: 401", async () => {
    expect((await llamar({ metricas: [metrica] }, "otra-clave-cualquiera-123456")).status).toBe(401);
  });
});

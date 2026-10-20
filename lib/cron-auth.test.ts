import { afterEach, describe, expect, it } from "vitest";
import { cronNoAutorizado } from "./cron-auth";

const pedir = (auth?: string) => new Request("https://x.test/api/cron/a", { headers: auth ? { authorization: auth } : {} });

describe("cronNoAutorizado", () => {
  afterEach(() => {
    delete process.env.CRON_SECRET;
  });
  it("rechaza todo si no hay CRON_SECRET", async () => {
    expect(cronNoAutorizado(pedir("Bearer "))?.status).toBe(401);
  });
  it("rechaza sin cabecera o con secreto incorrecto", () => {
    process.env.CRON_SECRET = "secreto-largo-de-prueba";
    expect(cronNoAutorizado(pedir())?.status).toBe(401);
    expect(cronNoAutorizado(pedir("Bearer otro-secreto-largo-xx"))?.status).toBe(401);
  });
  it("acepta el secreto correcto", () => {
    process.env.CRON_SECRET = "secreto-largo-de-prueba";
    expect(cronNoAutorizado(pedir("Bearer secreto-largo-de-prueba"))).toBeNull();
  });
});

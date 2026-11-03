import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { conBot, leerCuerpo } from "./entrada";
import { ActividadIn, BandejaIn } from "./esquemas";

// Supabase falso: cuenta llamadas previas y guarda lo que se apunta en el log.
const log: { bot: string; estado: number; ruta: string }[] = [];
let llamadasPrevias = 0;
vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ gte: async () => ({ count: llamadasPrevias, error: null }) }) }),
      insert: async (fila: { bot: string; estado: number; ruta: string }) => {
        log.push(fila);
        return { error: null };
      },
    }),
  }),
}));

const CLAVE_IDEAS = "clave-de-prueba-ideas-1234567890";
const peticion = (clave?: string, cuerpo?: unknown) =>
  new Request("https://panel.test/api/bots/actividad", {
    method: "POST",
    headers: clave ? { authorization: `Bearer ${clave}` } : {},
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
const responderOk = async () => Response.json({ ok: true });

beforeEach(() => {
  log.length = 0;
  llamadasPrevias = 0;
  vi.stubEnv("BOTS_API_KEY_IDEAS", CLAVE_IDEAS);
  vi.stubEnv("BOTS_API_KEY_ANTONIO", "");
  vi.stubEnv("BOTS_API_KEY_GUIONISTA", "");
});
afterEach(() => vi.unstubAllEnvs());

describe("puerta de los bots", () => {
  it("sin clave o con clave mala: 401 y no se apunta", async () => {
    expect((await conBot(peticion(), "actividad:escribir", responderOk)).status).toBe(401);
    expect((await conBot(peticion("otra-clave-cualquiera-123456"), "actividad:escribir", responderOk)).status).toBe(401);
    expect(log).toEqual([]);
  });
  it("una variable sin definir nunca deja pasar", async () => {
    expect((await conBot(peticion(""), "actividad:escribir", responderOk)).status).toBe(401);
  });
  it("con clave buena sabe qué bot es y apunta la llamada", async () => {
    let quien = "";
    const r = await conBot(peticion(CLAVE_IDEAS), "actividad:escribir", async (bot) => {
      quien = bot;
      return Response.json({ ok: true }, { status: 201 });
    });
    expect(r.status).toBe(201);
    expect(quien).toBe("ideas");
    expect(log).toMatchObject([{ bot: "ideas", estado: 201, ruta: "/api/bots/actividad" }]);
  });
  it("pasado el límite: 429 sin hacer el trabajo", async () => {
    llamadasPrevias = 60;
    const trabajo = vi.fn(responderOk);
    const r = await conBot(peticion(CLAVE_IDEAS), "actividad:escribir", trabajo);
    expect(r.status).toBe(429);
    expect(trabajo).not.toHaveBeenCalled();
    expect(log[0].estado).toBe(429);
  });
  it("si el trabajo falla: 500 sin enseñar el error, y queda apuntado", async () => {
    const r = await conBot(peticion(CLAVE_IDEAS), "actividad:escribir", async () => {
      throw new Error("secreto interno");
    });
    expect(r.status).toBe(500);
    expect(await r.text()).not.toContain("secreto");
    expect(log[0].estado).toBe(500);
  });
});

describe("datos de entrada", () => {
  const actividad = { tarea: "buscar ideas", inicio: "2026-11-03T08:00:00Z", resultado: "ok" };
  it("acepta una ejecución normal", async () => {
    expect(await leerCuerpo(peticion(undefined, actividad), ActividadIn)).toHaveProperty("datos");
  });
  it("rechaza resultados raros, fin anterior a inicio y JSON roto", async () => {
    for (const malo of [{ ...actividad, resultado: "quizas" }, { ...actividad, fin: "2026-11-03T07:00:00Z" }, undefined]) {
      const r = await leerCuerpo(peticion(undefined, malo), ActividadIn);
      expect("fallo" in r && r.fallo.status).toBe(400);
    }
  });
  it("el enlace solo puede ser http o https", async () => {
    const r = await leerCuerpo(peticion(undefined, { ...actividad, enlace: "javascript:alert(1)" }), ActividadIn);
    expect("fallo" in r).toBe(true);
  });
  it("ignora si el bot intenta decir que es otro o elegir módulo", async () => {
    const r = await leerCuerpo(peticion(undefined, { tipo: "aviso", titulo: "hola", modulo: "finanzas", origen_bot: "antonio" }), BandejaIn);
    expect("datos" in r && r.datos).toEqual({ tipo: "aviso", titulo: "hola" });
  });
});

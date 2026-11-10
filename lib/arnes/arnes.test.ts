import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as leer } from "@/app/api/bots/arnes/route";
import { POST as rutinas } from "@/app/api/bots/arnes/rutinas/route";
import { POST as tareas } from "@/app/api/bots/arnes/tareas/route";
import { clavePuede } from "@/lib/bots/catalogo";
import { RutinasIn, TareaIn } from "./esquemas";
import { calcularPendientes, porAgente, rutinasVista, tareasAbiertas, type DatosPanel, type TareaFila } from "./vista";

// Supabase falso en memoria: el upsert por id funciona como en Postgres (lo que no viene no se toca).
type Filas = Record<string, Record<string, unknown>[]>;
const tablas: Filas = {};
function consulta(tabla: string) {
  let filas = [...(tablas[tabla] ?? [])];
  const q = {
    eq: (c: string, v: unknown) => ((filas = filas.filter((f) => f[c] === v)), q),
    in: (c: string, v: unknown[]) => ((filas = filas.filter((f) => v.includes(f[c]))), q),
    gte: () => q,
    order: () => q,
    limit: () => q,
    then: (ok: (r: unknown) => unknown) => Promise.resolve({ data: filas, error: null, count: 0 }).then(ok),
  };
  return q;
}
vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => ({
    from: (tabla: string) => ({
      select: () => consulta(tabla),
      insert: async () => ({ error: null }),
      upsert: async (entrada: Record<string, unknown> | Record<string, unknown>[]) => {
        const lista = (tablas[tabla] ??= []);
        for (const fila of Array.isArray(entrada) ? entrada : [entrada]) {
          const limpia = JSON.parse(JSON.stringify(fila)); // como viaja a PostgREST: sin los undefined
          const previa = lista.find((f) => f.id === limpia.id);
          if (previa) Object.assign(previa, limpia);
          else lista.push({ empezada_en: "2026-11-10T08:00:00.000Z", ...limpia });
        }
        return { error: null };
      },
    }),
  }),
}));
vi.mock("@/lib/datos/dueno", () => ({ duenoId: async () => "jordi" }));
vi.mock("@/lib/arnes/calculados", () => ({ reunirPendientes: async () => ({ pendientes: [], fallos: [] }) }));

const CLAVE = "clave-de-prueba-antonio-1234567890";
const CLAVE_IDEAS = "clave-de-prueba-ideas-12345678901";
const pedir = (f: (r: Request) => Promise<Response>, cuerpo?: unknown, clave = CLAVE) =>
  f(new Request("https://panel.test/api/bots/arnes/x", { method: cuerpo === undefined ? "GET" : "POST", headers: { authorization: `Bearer ${clave}` }, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) }));

const rutina = { id: "manana", nombre: "Resumen de la mañana", horario: "Cada día a las 7:30", ultima_ejecucion: "2026-11-10T07:30:00+01:00", resultado: "ok", proxima: "2026-11-11T07:30:00+01:00" };
const tarea = { id: "t-ge031", titulo: "Guion de GE_031", agente: "guionista", estado: "esperando_agente", paso_actual: "Preguntas contestadas", falta: "Pasarlas al guion", enlace: "/elsa/videos/GE_031", actualizado_en: "2026-11-10T09:00:00+01:00" };

beforeEach(() => {
  for (const k of Object.keys(tablas)) delete tablas[k];
  vi.stubEnv("BOTS_API_KEY_ANTONIO", CLAVE);
  vi.stubEnv("BOTS_API_KEY_IDEAS", CLAVE_IDEAS);
});
afterEach(() => vi.unstubAllEnvs());

describe("permisos", () => {
  it("solo la llave de Antonio escribe y lee el arnés", () => {
    for (const p of ["arnes:leer", "arnes:escribir"] as const) {
      expect(clavePuede("antonio", p)).toBe(true);
      for (const otra of ["ideas", "guionista", "editor", "dia", "finanzas", "salud", "documentos"] as const) expect(clavePuede(otra, p)).toBe(false);
    }
  });
  it("otra llave válida: 403; sin llave buena: 401; y no se escribe nada", async () => {
    expect((await pedir(rutinas, [rutina], CLAVE_IDEAS)).status).toBe(403);
    expect((await pedir(tareas, tarea, CLAVE_IDEAS)).status).toBe(403);
    expect((await pedir(leer, undefined, CLAVE_IDEAS)).status).toBe(403);
    expect((await pedir(tareas, tarea, "una-clave-que-no-es-de-nadie")).status).toBe(401);
    expect(tablas.arnes_tareas).toBeUndefined();
    expect(tablas.arnes_rutinas).toBeUndefined();
  });
});

describe("validación", () => {
  it("rutinas: una lista, sin ids repetidos, resultado conocido", () => {
    expect(RutinasIn.safeParse([rutina]).success).toBe(true);
    expect(RutinasIn.safeParse(rutina).success).toBe(false);
    expect(RutinasIn.safeParse([]).success).toBe(false);
    expect(RutinasIn.safeParse([rutina, rutina]).success).toBe(false);
    expect(RutinasIn.safeParse([{ ...rutina, resultado: "regular" }]).success).toBe(false);
    expect(RutinasIn.safeParse([{ ...rutina, proxima: "mañana" }]).success).toBe(false);
    expect(RutinasIn.safeParse([{ id: "x", nombre: "Sin correr", horario: "Lunes" }]).success).toBe(true);
  });
  it("tareas: abierta dice paso, falta y enlace; cerrada basta con el estado", () => {
    expect(TareaIn.safeParse(tarea).success).toBe(true);
    expect(TareaIn.safeParse({ ...tarea, falta: undefined }).success).toBe(false);
    expect(TareaIn.safeParse({ ...tarea, agente: "contable" }).success).toBe(false);
    expect(TareaIn.safeParse({ ...tarea, estado: "parada" }).success).toBe(false);
    const { paso_actual, falta, enlace, ...minima } = tarea;
    void paso_actual, void falta, void enlace;
    expect(TareaIn.safeParse({ ...minima, estado: "hecha" }).success).toBe(true);
  });
  it("enlaces: ruta del panel, https o chat de Grok Bot; nada de javascript: ni //otro-dominio", () => {
    for (const e of ["/elsa/videos/GE_031", "https://drive.google.com/x", "grokbot://app/v1/agent?id=19f8baf3-f8b2-45f3-8006-5a4e85b67439"]) expect(TareaIn.safeParse({ ...tarea, enlace: e }).success).toBe(true);
    for (const e of ["javascript:alert(1)", "//malo.com", "http://x.com"]) expect(TareaIn.safeParse({ ...tarea, enlace: e }).success).toBe(false);
  });
  it("datos no válidos: 400 con detalle y sin escribir", async () => {
    const r = await pedir(tareas, { ...tarea, estado: "parada" });
    expect(r.status).toBe(400);
    expect((await r.json()).detalle.join()).toContain("estado");
    expect(tablas.arnes_tareas).toBeUndefined();
  });
});

describe("upsert", () => {
  it("la misma rutina dos veces no se duplica: se actualiza", async () => {
    expect((await pedir(rutinas, [rutina, { ...rutina, id: "noche", nombre: "Cierre" }])).status).toBe(200);
    expect((await pedir(rutinas, [{ ...rutina, resultado: "fallo" }])).status).toBe(200);
    expect(tablas.arnes_rutinas).toHaveLength(2);
    expect(tablas.arnes_rutinas.find((r) => r.id === "manana")).toMatchObject({ resultado: "fallo", user_id: "jordi" });
  });
  it("la misma tarea dos veces no se duplica y conserva cuándo empezó", async () => {
    await pedir(tareas, tarea);
    await pedir(tareas, { ...tarea, estado: "esperando_jordi", paso_actual: "Guion escrito", actualizado_en: "2026-11-10T12:00:00+01:00" });
    expect(tablas.arnes_tareas).toHaveLength(1);
    expect(tablas.arnes_tareas[0]).toMatchObject({ estado: "esperando_jordi", paso_actual: "Guion escrito", empezada_en: "2026-11-10T08:00:00.000Z", cerrada_en: null });
  });
});

describe("una tarea hecha desaparece de la vista", () => {
  it("por la API: al cerrarla deja de salir en GET /api/bots/arnes", async () => {
    await pedir(tareas, tarea);
    await pedir(tareas, { ...tarea, id: "t-otra", titulo: "Otra" });
    let r = await (await pedir(leer)).json();
    expect(r.tareas.map((t: { id: string }) => t.id).sort()).toEqual(["t-ge031", "t-otra"]);
    expect(r.tareas[0].enlace).toMatch(/^https:\/\/panel\.test\/elsa\/videos\//);

    const cierre = await pedir(tareas, { id: "t-ge031", titulo: "Guion de GE_031", agente: "guionista", estado: "hecha", actualizado_en: "2026-11-10T13:00:00+01:00" });
    expect(await cierre.json()).toEqual({ ok: true, id: "t-ge031", abierta: false });
    expect(tablas.arnes_tareas.find((t) => t.id === "t-ge031")).toMatchObject({ estado: "hecha", falta: "Pasarlas al guion" });
    expect(tablas.arnes_tareas.find((t) => t.id === "t-ge031")?.cerrada_en).toBeTruthy();
    r = await (await pedir(leer)).json();
    expect(r.tareas.map((t: { id: string }) => t.id)).toEqual(["t-otra"]);
  });
  it("en la lógica: hecha y cancelada fuera; lo tuyo y lo más viejo arriba; más de 24 h sin tocar, marcada", () => {
    const ahora = new Date("2026-11-10T12:00:00Z").getTime();
    const f = (id: string, estado: string, actualizado_en: string): TareaFila => ({ id, titulo: id, agente: "editor", estado, paso_actual: "p", falta: "f", enlace: "/", empezada_en: actualizado_en, actualizado_en });
    const v = tareasAbiertas([f("nueva", "en_curso", "2026-11-10T11:00:00Z"), f("vieja", "en_curso", "2026-11-08T11:00:00Z"), f("tuya", "esperando_jordi", "2026-11-10T10:00:00Z"), f("hecha", "hecha", "2026-11-01T00:00:00Z"), f("cancelada", "cancelada", "2026-11-01T00:00:00Z")], ahora);
    expect(v.map((t) => t.id)).toEqual(["tuya", "vieja", "nueva"]);
    expect(v.map((t) => t.sin_tocar_24h)).toEqual([false, true, false]);
    expect(v[0].quien).toBe("jordi");
  });
});

describe("pendientes calculados", () => {
  const base: DatosPanel = {
    ahora: new Date("2026-11-10T12:00:00Z").getTime(),
    hoy: "2026-11-10",
    horaMadrid: 12,
    titulos: { GE_031: "Jacuzzi al ático" },
    preguntas: [],
    sinMaterial: [],
    guiones: [],
    ideasNuevas: [],
    encargos: [],
    porRevisarSinEncargo: [],
    montandoSinEncargo: [],
    peticiones: [],
    redesUltima: "2026-11-09",
    informeRedes: "2026-11-05",
    saludUltima: "2026-11-09",
    resumenHoy: true,
    vencimientos: [],
    documentosConError: [],
    fallos: [],
  };
  it("con todo al día no hay nada", () => {
    expect(calcularPendientes(base)).toEqual([]);
  });
  it("cada pendiente dice a quién le toca y enlaza a su fuente", () => {
    const p = calcularPendientes({
      ...base,
      preguntas: [
        { video_id: "GE_031", respondida_en: null, recogida_en: null },
        { video_id: "GE_031", respondida_en: "2026-11-09T10:00:00Z", recogida_en: null },
      ],
      encargos: [{ id: "e1", video_id: "GE_031", version: 2, fase: "corte", estado: "listo", revisado_en: null, tomado_en: null, terminado_en: "2026-11-10T08:00:00Z", creado: "2026-11-09T00:00:00Z", error: null }],
      peticiones: [{ id: "p1", tipo: "material_listo", video_id: "GE_031", estado: "pendiente", creada_en: "2026-11-09T00:00:00Z" }],
      saludUltima: "2026-11-07",
      resumenHoy: false,
      fallos: [{ id: 7, bot: "dia", tarea: "Resumen", creado: "2026-11-10T07:00:00Z", enlace: null }],
    });
    const de = (id: string) => p.find((x) => x.id === id);
    expect(de("preguntas-GE_031")).toMatchObject({ agente: "guionista", quien: "jordi", enlace: "/elsa/videos/GE_031#preguntas" });
    expect(de("recoger-GE_031")).toMatchObject({ agente: "guionista", quien: "agente" });
    expect(de("encargo-e1")).toMatchObject({ agente: "editor", quien: "jordi", detalle: "Corte listo: te toca revisarlo", enlace: "/elsa/videos/GE_031#montaje" }); // sin esperar a Antonio
    expect(de("peticion-p1")).toMatchObject({ agente: "antonio", quien: "antonio", enlace: "/elsa/videos/GE_031" });
    expect(de("salud-metricas")).toMatchObject({ que: "2 días sin métricas de salud", enlace: "/salud" });
    expect(de("dia-resumen")).toMatchObject({ agente: "dia", enlace: "/" });
    expect(de("fallo-7")).toMatchObject({ agente: "dia", enlace: "/elsa/actividad/bots?bot=dia" });
  });
  it("el estado del vídeo y la cola cuadran: lo que no, sale (y lo atascado más de 2 h)", () => {
    const enc = (id: string, estado: string, tomado_en: string | null, creado: string) => ({ id, video_id: "GE_032", version: 1, fase: "acabado", estado, revisado_en: null, tomado_en, terminado_en: null, creado, error: null });
    const p = calcularPendientes({
      ...base,
      encargos: [enc("viejo", "en_curso", "2026-11-10T09:00:00Z", "2026-11-10T08:00:00Z"), enc("reciente", "en_curso", "2026-11-10T11:30:00Z", "2026-11-10T11:00:00Z"), enc("cola", "pendiente", null, "2026-11-10T07:00:00Z")],
      porRevisarSinEncargo: [{ id: "GE_033", estado: "acabado_listo", montaje_url: "https://drive.google.com/x", actualizado_en: "2026-11-10T07:14:00Z" }],
      montandoSinEncargo: [{ id: "GE_030", actualizado_en: "2026-11-06T11:58:00Z" }],
    });
    const de = (id: string) => p.find((x) => x.id === id);
    expect(de("encargo-viejo")).toMatchObject({ quien: "antonio", detalle: "Lleva 3 h montándose" });
    expect(de("encargo-reciente")).toBeUndefined();
    expect(de("encargo-cola")).toMatchObject({ detalle: "Lleva 5 h en la cola sin que nadie lo tome" });
    expect(de("revisar-GE_033")).toMatchObject({ agente: "editor", quien: "jordi", enlace: "/elsa/videos/GE_033#montaje" });
    expect(de("desfasado-GE_030")).toMatchObject({ agente: "antonio", quien: "antonio" });
  });
  it("por agente: todos en orden, con su chat; Finanzas congelado y sin pendientes", () => {
    const g = porAgente(calcularPendientes({ ...base, fallos: [{ id: 1, bot: "finanzas", tarea: "x", creado: "2026-11-10T00:00:00Z", enlace: null }] }), []);
    expect(g.map((x) => x.agente)).toEqual(["antonio", "guionista", "editor", "analista", "ideas", "dia", "salud", "documentos", "finanzas", "revisor"]);
    expect(g.find((x) => x.agente === "guionista")?.chat).toBe("grokbot://app/v1/agent?id=19f8baf3-f8b2-45f3-8006-5a4e85b67439");
    expect(g.find((x) => x.agente === "finanzas")).toMatchObject({ congelado: true, pendientes: [] });
  });
});

describe("rutinas", () => {
  it("la que falló o se saltó su hora, arriba", () => {
    const ahora = new Date("2026-11-10T12:00:00Z").getTime();
    const r = (id: string, resultado: string, proxima: string) => ({ id, nombre: id, horario: "h", ultima_ejecucion: null, resultado, proxima, nota: null, actualizado: "" });
    const v = rutinasVista([r("bien", "ok", "2026-11-10T18:00:00Z"), r("saltada", "ok", "2026-11-10T08:00:00Z"), r("rota", "fallo", "2026-11-11T08:00:00Z")], ahora);
    expect(v.map((x) => [x.id, x.atrasada])).toEqual([["rota", false], ["saltada", true], ["bien", false]]);
  });
  it("una pausada no cuenta como saltada y va al final", () => {
    const ahora = new Date("2026-11-10T12:00:00Z").getTime();
    const v = rutinasVista([{ id: "pausa", nombre: "p", horario: "h", ultima_ejecucion: null, resultado: "ok", proxima: "2026-11-01T00:00:00Z", nota: null, actualizado: "", activa: false }, { id: "bien", nombre: "b", horario: "h", ultima_ejecucion: null, resultado: "ok", proxima: null, nota: null, actualizado: "" }], ahora);
    expect(v.map((x) => [x.id, x.atrasada])).toEqual([["bien", false], ["pausa", false]]);
  });
});

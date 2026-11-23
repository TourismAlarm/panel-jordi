import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sumarDias } from "@/lib/fechas";

// GET /api/bots/hoy/datos: hoy entero; un día pasado (hasta 14 atrás), solo sus cosas con lo tachado.
const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date());
let filaPasada: { data: unknown; error: null } = { data: null, error: null };
const pedidas: string[] = [];
let tachadas: Record<string, string> = {};

function consulta(resultado: unknown): unknown {
  const q: unknown = new Proxy(() => {}, {
    get: (_, k) => (k === "then" ? (ok: (v: unknown) => void) => ok(resultado) : k === "maybeSingle" ? async () => resultado : k === "eq" ? (c: string, v: string) => (c === "fecha" && pedidas.push(v), q) : () => q),
    apply: () => q,
  });
  return q;
}
vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => ({ from: (tabla: string) => consulta(tabla === "resumenes_diarios" ? filaPasada : { count: 0, error: null }) }),
}));
vi.mock("@/lib/datos/dueno", () => ({ duenoId: async () => "jordi" }));
vi.mock("@/lib/hoy/tachadas", () => ({ leerTachadas: async () => tachadas }));
vi.mock("@/lib/hoy/reunir", () => ({
  reunirHoy: async () => ({
    fecha: hoy, senales: [], eventos: [], correos: [], agendaEn: null, correosEn: null, contexto: "ok", fallos: [], salud: [],
    guardado: { resumen: "x", prioridades: [{ texto: "Leer bandeja", nivel: "importante", enlace: "/bandeja" }, { texto: "Llamar al gestor", nivel: "urgente" }], marcas: {}, generado_en: null, origen: "bot" },
    abierto: { videos: [], bandeja: 2, documentos: [] },
    tachadas,
  }),
}));

const { GET } = await import("@/app/api/bots/hoy/datos/route");
const CLAVE = "clave-de-prueba-antonio-1234567890";
const pedir = (q = "") => GET(new Request(`https://panel.test/api/bots/hoy/datos${q}`, { headers: { authorization: `Bearer ${CLAVE}` } }));

beforeEach(() => {
  vi.stubEnv("BOTS_API_KEY_ANTONIO", CLAVE);
  filaPasada = { data: null, error: null };
  pedidas.length = 0;
  tachadas = {};
});
afterEach(() => vi.unstubAllEnvs());

describe("GET /api/bots/hoy/datos", () => {
  it("hoy: lo tachado otro día sale hecho «a mano» con su día; lo demás, como siempre", async () => {
    tachadas = { "texto:llamar al gestor": sumarDias(hoy, -3) };
    const r = await pedir();
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.cosas_de_hoy).toEqual([
      { texto: "Leer bandeja", nivel: "importante", enlace: "/bandeja", hecha: false, como: null, hecha_el: null },
      { texto: "Llamar al gestor", nivel: "urgente", enlace: null, hecha: true, como: "a mano", hecha_el: sumarDias(hoy, -3) },
    ]);
    expect(j).toHaveProperty("agenda");
  });

  it("un día pasado: solo fecha y cosas_de_hoy de ese día, con lo tachado ese día", async () => {
    const ayer = sumarDias(hoy, -1);
    filaPasada = { data: { prioridades: [{ texto: "Revisar GE_031", nivel: "importante", enlace: "/elsa/videos/GE_031" }, { texto: "Pagar la ITV", nivel: "urgente" }], marcas: { "texto:pagar la itv": true } }, error: null };
    const r = await pedir(`?fecha=${ayer}`);
    expect(r.status).toBe(200);
    expect(pedidas).toContain(ayer);
    expect(await r.json()).toEqual({
      fecha: ayer,
      cosas_de_hoy: [
        { texto: "Revisar GE_031", nivel: "importante", enlace: "/elsa/videos/GE_031", hecha: true, como: "sola", hecha_el: null },
        { texto: "Pagar la ITV", nivel: "urgente", enlace: null, hecha: true, como: "a mano", hecha_el: ayer },
      ],
    });
  });

  it("un día pasado sin resumen: cosas_de_hoy vacío", async () => {
    expect(await (await pedir(`?fecha=${sumarDias(hoy, -14)}`)).json()).toEqual({ fecha: sumarDias(hoy, -14), cosas_de_hoy: [] });
  });

  it("más de 14 días atrás, futuro o fecha rara: 400", async () => {
    for (const f of [sumarDias(hoy, -15), sumarDias(hoy, 1), "2026-02-30", "ayer"]) expect((await pedir(`?fecha=${f}`)).status).toBe(400);
  });
});

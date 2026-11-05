import { beforeEach, describe, expect, it, vi } from "vitest";

// Google no debe tocarse desde Hoy: si alguien lo vuelve a llamar, estas funciones lo delatan.
const google = { token: vi.fn(), eventos: vi.fn(), correos: vi.fn() };
vi.mock("@/lib/google/cliente", () => ({ tokenDeAcceso: (...a: unknown[]) => google.token(...a), getGoogle: vi.fn() }));
vi.mock("@/lib/google/agenda", () => ({ eventosDeHoy: (...a: unknown[]) => google.eventos(...a), correosSinLeer: (...a: unknown[]) => google.correos(...a), inicioDiaMadrid: vi.fn() }));
vi.mock("@/lib/finanzas/resumen-inicio", () => ({ resumenInicio: async () => ({ uncategorized: { count: 0 }, remaining: 0, perDay: null, payday: null }) }));
vi.mock("@/lib/datos/salud", () => ({ leerSalud: async () => ({ hoy: "2026-11-05", series: {}, registros: [], entrenos: [] }) }));
vi.mock("@/lib/salud/resumen", () => ({ construirResumen: () => ({ lineas: [], datosDe: null, avisoMedico: false }) }));

// Supabase falso: toda consulta devuelve vacío, salvo la fila del día.
let fila: { data: unknown; error: { message: string } | null };
function consulta(resultado: unknown): unknown {
  const q: unknown = new Proxy(() => {}, {
    get: (_, k) => (k === "then" ? (ok: (v: unknown) => void) => ok(resultado) : k === "maybeSingle" || k === "single" ? async () => resultado : () => q),
    apply: () => q,
  });
  return q;
}
const db = { from: (tabla: string) => consulta(tabla === "resumenes_diarios" ? fila : { data: [], error: null, count: 0 }) };
vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: () => db }));

const { reunirHoy } = await import("./reunir");
const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date());

beforeEach(() => {
  for (const f of Object.values(google)) f.mockReset();
  google.token.mockResolvedValue("token-de-google");
});

describe("Hoy sin Google", () => {
  it("con Google conectado, no lo consulta: enseña lo publicado y suma la agenda a las señales", async () => {
    fila = { data: { resumen: null, prioridades: [], generado_en: null, origen: null, agenda: [{ titulo: "Dentista", todoElDia: false, inicio: `${hoy}T09:00:00+01:00`, fin: null, lugar: null, calendario: "Personal" }], correos: [], agenda_en: `${hoy}T06:00:00Z`, correos_en: null }, error: null };
    const f = await reunirHoy(db as never, "jordi");
    expect(google.token).not.toHaveBeenCalled();
    expect(google.eventos).not.toHaveBeenCalled();
    expect(google.correos).not.toHaveBeenCalled();
    expect(f.eventos.map((e) => e.titulo)).toEqual(["Dentista"]);
    expect(f.senales.filter((s) => s.modulo === "agenda")).toHaveLength(1);
    expect(f).toMatchObject({ correos: [], correosEn: null, contexto: "ok", guardado: null });
    expect(f).not.toHaveProperty("google");
  });
  it("una fila solo con contexto no cuenta como resumen; con resumen, sí", async () => {
    fila = { data: { resumen: "Hoy toca grabar.", prioridades: ["x"], generado_en: `${hoy}T07:00:00Z`, origen: "bot", agenda: [], correos: [], agenda_en: null, correos_en: null }, error: null };
    expect((await reunirHoy(db as never, "jordi")).guardado).toMatchObject({ resumen: "Hoy toca grabar.", origen: "bot" });
  });
  it("sin fila del día: nada publicado, sin fallo", async () => {
    fila = { data: null, error: null };
    const f = await reunirHoy(db as never, "jordi");
    expect(f).toMatchObject({ eventos: [], agendaEn: null, contexto: "ok" });
    expect(f.fallos).toEqual([]);
  });
  it("si no se puede leer, lo dice: no lo convierte en «no hay citas»", async () => {
    fila = { data: null, error: { message: "caída" } };
    const f = await reunirHoy(db as never, "jordi");
    expect(f.contexto).toBe("error");
    expect(f.fallos).toContain("Agenda y correo");
  });
});

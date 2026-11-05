import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Foto } from "./reunir";

// El generador escribe solo por la función de la base, que es la que protege el resumen del bot y el contexto.
let foto: Foto;
const rpc = vi.fn(async (..._a: unknown[]) => ({ data: true as boolean | null, error: null as { message: string } | null }));
const escrituras = vi.fn();
vi.mock("./reunir", () => ({ reunirHoy: async () => foto }));
vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: () => ({ rpc: (...a: unknown[]) => rpc(...a), from: () => ({ upsert: escrituras, update: escrituras, insert: escrituras }) }) }));
vi.mock("@/lib/datos/dueno", () => ({ duenoId: async () => "jordi" }));
const { generarResumen } = await import("./generar");

const base: Foto = { fecha: "2026-11-05", senales: [], eventos: [], correos: [], agendaEn: null, correosEn: null, contexto: "ok", guardado: null, fallos: [], salud: [] };

beforeEach(() => {
  rpc.mockClear();
  rpc.mockImplementation(async () => ({ data: true, error: null }));
  escrituras.mockClear();
  foto = { ...base };
});

describe("resumen sencillo", () => {
  it("se guarda por la función atómica, sin escribir la fila a mano", async () => {
    expect(await generarResumen()).toEqual({ fecha: "2026-11-05", fallos: [] });
    expect(rpc).toHaveBeenCalledWith("hoy_guardar_resumen_sencillo", expect.objectContaining({ p_user: "jordi", p_fecha: "2026-11-05", p_forzar: false, p_resumen: "Nada urgente." }));
    expect(escrituras).not.toHaveBeenCalled();
  });
  it("una fila con solo agenda y correo no frena al cron", async () => {
    foto = { ...base, agendaEn: "2026-11-05T06:00:00Z" };
    await generarResumen();
    expect(rpc).toHaveBeenCalled();
  });
  it("el del bot no se toca, ni forzando", async () => {
    foto = { ...base, guardado: { resumen: "del bot", prioridades: [], generado_en: "x", origen: "bot" } };
    expect(await generarResumen({ forzar: true })).toMatchObject({ yaExistia: true });
    expect(rpc).not.toHaveBeenCalled();
  });
  it("forzar llega a la base; y si la base no escribe (el bot llegó antes), lo dice", async () => {
    foto = { ...base, guardado: { resumen: "sencillo", prioridades: [], generado_en: "x", origen: "cron" } };
    rpc.mockImplementation(async () => ({ data: false, error: null }));
    expect(await generarResumen({ forzar: true })).toMatchObject({ yaExistia: true });
    expect(rpc.mock.calls[0][1]).toMatchObject({ p_forzar: true });
  });
  it("si la base falla, no da por bueno el resumen", async () => {
    rpc.mockImplementation(async () => ({ data: null, error: { message: "caída" } }));
    await expect(generarResumen()).rejects.toThrow();
  });
});

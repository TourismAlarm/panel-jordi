import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as contexto } from "@/app/api/bots/hoy/contexto/route";
import { POST as resumen } from "@/app/api/bots/hoy/resumen/route";

// Supabase falso: guarda las llamadas a la función de contexto y lo que se escribe en el resumen.
const rpc = vi.fn(async (..._a: unknown[]) => ({ error: null as { message: string } | null }));
const upserts: Record<string, unknown>[] = [];
vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => ({
    rpc: (...a: unknown[]) => rpc(...a),
    from: (tabla: string) => ({
      select: () => ({ eq: () => ({ gte: async () => ({ count: 0, error: null }) }) }),
      insert: async () => ({ error: null }),
      upsert: async (fila: Record<string, unknown>) => {
        if (tabla === "resumenes_diarios") upserts.push(fila);
        return { error: null };
      },
    }),
  }),
}));
vi.mock("@/lib/datos/dueno", () => ({ duenoId: async () => "jordi" }));

const CLAVE = "clave-de-prueba-antonio-1234567890";
const pedir = (f: (r: Request) => Promise<Response>, cuerpo: unknown, clave = CLAVE) =>
  f(new Request("https://panel.test/api/bots/hoy/x", { method: "POST", headers: { authorization: `Bearer ${clave}` }, body: JSON.stringify(cuerpo) }));
const cita = { titulo: "Revisión", todoElDia: false, inicio: "2026-11-05T09:00:00+01:00" };

beforeEach(() => {
  rpc.mockClear();
  rpc.mockImplementation(async () => ({ error: null }));
  upserts.length = 0;
  vi.stubEnv("BOTS_API_KEY_ANTONIO", CLAVE);
});
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/bots/hoy/contexto", () => {
  it("Antonio publica con la firma dia; el bloque que no viene va como null y no se toca", async () => {
    const r = await pedir(contexto, { bot: "dia", fecha: "2026-11-05", agenda: [cita] });
    expect(r.status).toBe(201);
    expect(await r.json()).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith("hoy_publicar_contexto", {
      p_user: "jordi",
      p_fecha: "2026-11-05",
      p_agenda: [{ titulo: "Revisión", todoElDia: false, inicio: "2026-11-05T09:00:00+01:00", fin: null, lugar: null, calendario: null }],
      p_correos: null,
    });
  });
  it("[] se manda como [] (revisado y vacío)", async () => {
    await pedir(contexto, { fecha: "2026-11-05", correos: [] });
    expect(rpc.mock.calls[0][1]).toMatchObject({ p_agenda: null, p_correos: [] });
  });
  it("solo firma Día: ni Antonio como él mismo, ni Ideas ni Guionista; sin clave, 401", async () => {
    for (const bot of ["antonio", "ideas", "guionista", "finanzas"]) expect((await pedir(contexto, { bot, fecha: "2026-11-05", agenda: [] })).status).toBe(403);
    expect((await pedir(contexto, { fecha: "2026-11-05", agenda: [] }, "otra-clave-cualquiera-123456")).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("datos no válidos: 400 sin escribir", async () => {
    expect((await pedir(contexto, { fecha: "2026-11-05", agenda: null })).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("si la base falla: 500 sin decir por qué y sin dar el ok", async () => {
    rpc.mockImplementation(async () => ({ error: { message: "secreto de la base" } }));
    const r = await pedir(contexto, { fecha: "2026-11-05", agenda: [] });
    expect(r.status).toBe(500);
    expect(await r.text()).not.toContain("secreto");
  });
});

describe("POST /api/bots/hoy/resumen", () => {
  const base = { bot: "dia", fecha: "2026-11-05", resumen: "Hoy toca grabar.", prioridades: [] };
  it("sin senales no las borra: ni siquiera se mandan", async () => {
    expect((await pedir(resumen, base)).status).toBe(201);
    expect(upserts[0]).not.toHaveProperty("senales");
    expect(upserts[0]).toMatchObject({ origen: "bot", resumen: "Hoy toca grabar." });
  });
  it("con senales, sí; y nunca toca agenda ni correo", async () => {
    await pedir(resumen, { ...base, senales: { x: 1 } });
    expect(upserts[0]).toMatchObject({ senales: { x: 1 } });
    for (const k of ["agenda", "correos", "agenda_en", "correos_en", "enviado_en"]) expect(upserts[0]).not.toHaveProperty(k);
  });
});

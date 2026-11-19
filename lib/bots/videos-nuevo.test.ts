import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/bots/videos/route";

// Supabase falso: la función crear_ge_de_carpeta responde lo que diga cada prueba; se apunta lo que se escribe.
const rpc = vi.fn();
const actividad: Record<string, unknown>[] = [];
vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => ({
    rpc: (...a: unknown[]) => rpc(...a),
    from: (tabla: string) => ({
      select: () => ({ eq: () => ({ gte: async () => ({ count: 0, error: null }) }) }),
      insert: async (fila: Record<string, unknown>) => {
        if (tabla === "actividad_bots") actividad.push(fila);
        return { error: null };
      },
    }),
  }),
}));

const ANTONIO = "clave-de-prueba-antonio-1234567890";
const EDITOR = "clave-de-prueba-editor-12345678901";
const IDEAS = "clave-de-prueba-ideas-123456789012";
const CARPETA = "1oYxAbCdEfGhIjKlMnOp";
const buena = { bot: "antonio", titulo: "Arbolar un velero", carpeta_drive_id: CARPETA, sin_guion: true, estado: "material_listo", nota: "Material del 29/10" };
const pedir = (cuerpo: unknown, clave = ANTONIO) =>
  POST(new Request("https://panel.test/api/bots/videos", { method: "POST", headers: { authorization: `Bearer ${clave}` }, body: JSON.stringify(cuerpo) }));

beforeEach(() => {
  rpc.mockReset();
  rpc.mockResolvedValue({ data: { id: "GE_051", nuevo: true }, error: null });
  actividad.length = 0;
  vi.stubEnv("BOTS_API_KEY_ANTONIO", ANTONIO);
  vi.stubEnv("BOTS_API_KEY_EDITOR", EDITOR);
  vi.stubEnv("BOTS_API_KEY_IDEAS", IDEAS);
});
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/bots/videos", () => {
  it("crea el GE sobre la carpeta: 201, una sola escritura y la actividad apuntada", async () => {
    const r = await pedir(buena);
    expect(r.status).toBe(201);
    expect(await r.json()).toEqual({ ok: true, id: "GE_051", enlace: "/elsa/videos/GE_051" });
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("crear_ge_de_carpeta", { p_titulo: "Arbolar un velero", p_carpeta: CARPETA, p_sin_guion: true, p_estado: "material_listo", p_fecha: null });
    expect(actividad[0]).toMatchObject({ bot: "antonio", tarea: "GE_051 creado por Antonio (sin guion)", resultado: "ok", nota: "Arbolar un velero · Material del 29/10", enlace: `https://drive.google.com/drive/folders/${CARPETA}` });
  });

  it("por defecto: sin guion y material listo; pasa la fecha si la hay", async () => {
    await pedir({ titulo: "Placas solares", carpeta_drive_id: CARPETA, fecha_trabajo: "2026-11-17" });
    expect(rpc).toHaveBeenCalledWith("crear_ge_de_carpeta", expect.objectContaining({ p_sin_guion: true, p_estado: "material_listo", p_fecha: "2026-11-17" }));
  });

  it("la misma carpeta otra vez: 409 con el vídeo que ya tiene y sin apuntar nada", async () => {
    rpc.mockResolvedValue({ data: { id: "GE_051", nuevo: false }, error: null });
    const r = await pedir(buena);
    expect(r.status).toBe(409);
    expect(await r.json()).toMatchObject({ id: "GE_051", enlace: "/elsa/videos/GE_051" });
    expect(actividad).toHaveLength(0);
  });

  it("con la clave del Editor o de Ideas: 403 y no se crea nada", async () => {
    expect((await pedir(buena, EDITOR)).status).toBe(403);
    expect((await pedir({ ...buena, bot: undefined }, IDEAS)).status).toBe(403);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("con la clave de Antonio firmando como otro bot: 403", async () => {
    expect((await pedir({ ...buena, bot: "ideas" })).status).toBe(403);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("título con datos de cliente: 422 y no se crea nada", async () => {
    const r = await pedir({ ...buena, titulo: "Grúa en Calle Mayor 12, tel 612345678" });
    expect(r.status).toBe(422);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("enlace en vez de id de carpeta, o estado raro: 400", async () => {
    expect((await pedir({ ...buena, carpeta_drive_id: `https://drive.google.com/drive/folders/${CARPETA}` })).status).toBe(400);
    expect((await pedir({ ...buena, estado: "aprobado" })).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("sin clave: 401", async () => {
    expect((await pedir(buena, "mala-clave-mala-clave-mala")).status).toBe(401);
  });
});

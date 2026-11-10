import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as noExiste } from "@/app/api/bots/[...resto]/route";
import { POST as cerrar } from "@/app/api/bots/edicion/[id]/cerrar/route";
import { POST as entrega } from "@/app/api/bots/videos/[id]/entrega/route";
import { clavePuede } from "./catalogo";

// Supabase falso: la función entregar_montaje responde lo que diga cada prueba; se apunta lo que se escribe.
const rpc = vi.fn();
const avisos = vi.fn();
const actividad: Record<string, unknown>[] = [];
let encargo: { estado: string } | null = null;
const cierres: Record<string, unknown>[] = [];
vi.mock("@/lib/bots/aviso", () => ({ avisarAntonio: (...a: unknown[]) => avisos(...a) }));
vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => ({
    rpc: (...a: unknown[]) => rpc(...a),
    from: (tabla: string) => ({
      select: () => ({
        eq: () => ({ gte: async () => ({ count: 0, error: null }), maybeSingle: async () => ({ data: encargo, error: null }) }),
      }),
      insert: async (fila: Record<string, unknown>) => {
        if (tabla === "actividad_bots") actividad.push(fila);
        return { error: null };
      },
      update: (fila: Record<string, unknown>) => ({
        eq: () => ({ in: () => ({ select: async () => (cierres.push(fila), { data: [{ id: "x" }], error: null }) }) }),
      }),
    }),
  }),
}));

const ANTONIO = "clave-de-prueba-antonio-1234567890";
const EDITOR = "clave-de-prueba-editor-12345678901";
const IDEAS = "clave-de-prueba-ideas-123456789012";
const ID_ENCARGO = "7e061742-ae41-481c-af58-f950be44fa5e";
const pedir = (f: (r: Request, c: { params: Promise<{ id: string }> }) => Promise<Response>, id: string, cuerpo: unknown, clave = ANTONIO) =>
  f(new Request(`https://panel.test/api/bots/x/${id}`, { method: "POST", headers: { authorization: `Bearer ${clave}` }, body: JSON.stringify(cuerpo) }), { params: Promise.resolve({ id }) });
const buena = { fase: "acabado", version: "claude-v2", resultado_url: "https://drive.google.com/file/d/1Eke/view", duracion_real_s: 34.9, notas: "Orden cronológico", hecho_por: "editor-claude-code" };

beforeEach(() => {
  rpc.mockReset();
  rpc.mockResolvedValue({ data: { id: "nuevo-id", version: 1, nuevo: true }, error: null });
  avisos.mockClear();
  actividad.length = 0;
  cierres.length = 0;
  encargo = null;
  vi.stubEnv("BOTS_API_KEY_ANTONIO", ANTONIO);
  vi.stubEnv("BOTS_API_KEY_EDITOR", EDITOR);
  vi.stubEnv("BOTS_API_KEY_IDEAS", IDEAS);
});
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/bots/videos/{id}/entrega", () => {
  it("entrega: 201, una sola escritura (la función) y la actividad apuntada", async () => {
    const r = await pedir(entrega, "GE_033", buena);
    expect(r.status).toBe(201);
    expect(await r.json()).toEqual({ ok: true, id: "nuevo-id", version: 1, nuevo: true });
    expect(rpc).toHaveBeenCalledWith("entregar_montaje", { p_video: "GE_033", p_fase: "acabado", p_version: "claude-v2", p_url: buena.resultado_url, p_duracion: 34.9, p_notas: "Orden cronológico", p_quien: "editor-claude-code" });
    expect(actividad[0]).toMatchObject({ bot: "editor", tarea: "Montaje entregado GE_033 claude-v2", resultado: "ok", enlace: buena.resultado_url });
    expect(avisos).not.toHaveBeenCalled(); // la subió Antonio: ya lo sabe
  });
  it("la misma versión otra vez: 200 (actualiza, no duplica)", async () => {
    rpc.mockResolvedValue({ data: { id: "nuevo-id", version: 1, nuevo: false }, error: null });
    expect((await pedir(entrega, "GE_033", buena)).status).toBe(200);
  });
  it("con la llave del Editor también vale, y avisa a Antonio", async () => {
    expect((await pedir(entrega, "GE_033", buena, EDITOR)).status).toBe(201);
    expect(avisos).toHaveBeenCalledWith({ evento: "edicion_lista", encargo_id: "nuevo-id", video_id: "GE_033", version: 1, estado: "listo" });
  });
  it("otra llave: 403 sin tocar nada", async () => {
    expect((await pedir(entrega, "GE_033", buena, IDEAS)).status).toBe(403);
    expect(rpc).not.toHaveBeenCalled();
    expect(clavePuede("editor", "edicion:cerrar")).toBe(false);
  });
  it("vídeo inexistente: 404; versión ya decidida: 409", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "P0002", message: "ese vídeo no existe" } });
    expect((await pedir(entrega, "GE_999", buena)).status).toBe(404);
    rpc.mockResolvedValue({ data: null, error: { code: "P0001", message: "esa versión ya está decidida (aprobado)" } });
    const r = await pedir(entrega, "GE_033", buena);
    expect(r.status).toBe(409);
    expect((await r.json()).error).toContain("decidida");
  });
  it("datos de clientes en las notas: 422 sin escribir", async () => {
    expect((await pedir(entrega, "GE_033", { ...buena, notas: "Llamar al 612 345 678" })).status).toBe(422);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("url que no es https, fase rara, sin duración o id raro: 400 sin escribir", async () => {
    for (const malo of [{ ...buena, resultado_url: "http://drive.google.com/x" }, { ...buena, fase: "final" }, { ...buena, duracion_real_s: undefined }, { ...buena, version: "v 2/x" }]) {
      expect((await pedir(entrega, "GE_033", malo)).status).toBe(400);
    }
    expect((await pedir(entrega, "33", buena)).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe("POST /api/bots/edicion/{id}/cerrar", () => {
  it("cierra un fallido con su motivo", async () => {
    encargo = { estado: "fallido" };
    const r = await pedir(cerrar, ID_ENCARGO, { motivo: "GE_032 ya está aprobado por otro camino" });
    expect(r.status).toBe(200);
    expect(cierres[0]).toMatchObject({ estado: "cerrado", error: "Cerrado por Antonio: GE_032 ya está aprobado por otro camino" });
  });
  it("no existe: 404; en curso o aprobado: 409; ya cerrado: 200 sin tocar; sin motivo: 400", async () => {
    expect((await pedir(cerrar, ID_ENCARGO, { motivo: "x" })).status).toBe(404);
    for (const estado of ["en_curso", "aprobado"]) {
      encargo = { estado };
      expect((await pedir(cerrar, ID_ENCARGO, { motivo: "x" })).status).toBe(409);
    }
    encargo = { estado: "cerrado" };
    expect(await (await pedir(cerrar, ID_ENCARGO, { motivo: "x" })).json()).toEqual({ ok: true, ya_estaba: true });
    expect((await pedir(cerrar, ID_ENCARGO, {})).status).toBe(400);
    expect(cierres).toHaveLength(0);
  });
  it("solo Antonio: el Editor no cierra encargos", async () => {
    encargo = { estado: "fallido" };
    expect((await pedir(cerrar, ID_ENCARGO, { motivo: "x" }, EDITOR)).status).toBe(403);
  });
});

describe("ruta que no existe", () => {
  it("responde JSON 404, no una página", async () => {
    const r = await noExiste();
    expect(r.status).toBe(404);
    expect(r.headers.get("content-type")).toContain("application/json");
  });
});

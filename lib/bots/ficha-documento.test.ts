import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/bots/documentos/[id]/ficha/route";

// Supabase falso: un documento y su ficha, y lo que se intenta escribir.
const ID = "00000000-0000-4000-8000-000000000001";
let origenFicha: string | null;
let estadoDoc: string | null;
const escrito: { tabla: string; fila: Record<string, unknown> }[] = [];

const consulta = (tabla: string) => {
  const q = {
    select: () => q,
    eq: () => q,
    gte: async () => ({ count: 0, error: null }),
    maybeSingle: async () => {
      if (tabla === "doc_documentos") return { data: estadoDoc ? { estado: estadoDoc } : null, error: null };
      return { data: origenFicha ? { origen: origenFicha } : null, error: null };
    },
    single: async () => ({ data: { user_id: "jordi" }, error: null }),
    limit: () => q,
    insert: async () => ({ error: null }),
    update: (fila: Record<string, unknown>) => {
      escrito.push({ tabla, fila });
      return { eq: () => ({ eq: async () => ({ error: null }) }) };
    },
    upsert: async (fila: Record<string, unknown>) => {
      escrito.push({ tabla, fila });
      return { error: null };
    },
  };
  return q;
};
vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: () => ({ from: consulta }) }));

const CLAVE = "clave-de-prueba-antonio-1234567890";
const llamar = (cuerpo: unknown) => POST(new Request(`https://panel.test/api/bots/documentos/${ID}/ficha`, { method: "POST", headers: { authorization: `Bearer ${CLAVE}` }, body: JSON.stringify(cuerpo) }), { params: Promise.resolve({ id: ID }) });

beforeEach(() => {
  origenFicha = null;
  estadoDoc = "pendiente";
  escrito.length = 0;
  vi.stubEnv("BOTS_API_KEY_ANTONIO", CLAVE);
});
afterEach(() => vi.unstubAllEnvs());

describe("ficha que deja el bot de Documentos", () => {
  const ficha = { categoria: "Seguros", titular: "Jordi", resumen: "Póliza del camión", referencia: "ES12345678", vencimiento: "2027-01-01" };

  it("se guarda como del bot, con solo los 4 últimos de la referencia", async () => {
    expect((await llamar(ficha)).status).toBe(201);
    const f = escrito.find((x) => x.tabla === "doc_fichas")?.fila;
    expect(f).toMatchObject({ origen: "bot", titular: "Jordi", resumen: "Póliza del camión", referencia: "···5678", vencimiento: "2027-01-01" });
  });
  it("nunca pisa una ficha escrita a mano", async () => {
    origenFicha = "manual";
    expect((await llamar(ficha)).status).toBe(409);
    expect(escrito).toEqual([]);
  });
  it("sí sustituye una ficha leída por la IA", async () => {
    origenFicha = "claude";
    expect((await llamar(ficha)).status).toBe(201);
  });
  it("si no existe: 404, y una nota no lleva ficha", async () => {
    estadoDoc = null;
    expect((await llamar(ficha)).status).toBe(404);
    estadoDoc = "nota";
    expect((await llamar(ficha)).status).toBe(409);
    expect(escrito).toEqual([]);
  });
  it("Ideas no puede firmarla", async () => {
    expect((await llamar({ ...ficha, bot: "ideas" })).status).toBe(403);
    expect(escrito).toEqual([]);
  });
});

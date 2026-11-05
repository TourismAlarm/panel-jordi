import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cuerpoDocumento, enviarDia, enviarDocumentos } from "./webhook-vida";

const apuntado: { bot: string; nota: string }[] = [];
vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => ({
    from: () => ({
      insert: async (fila: { bot: string; nota: string }) => {
        apuntado.push(fila);
        return { error: null };
      },
    }),
  }),
}));

const DOC = { id: "d1", nombre: "poliza.pdf", mime: "application/pdf", categoria: "Seguros", subido_en: "2026-11-05T10:00:00Z", texto: "SECRETO" };

beforeEach(() => {
  apuntado.length = 0;
  vi.stubEnv("GROKBOT_DOCS_WEBHOOK_URL", "https://bot.test/docs");
  vi.stubEnv("GROKBOT_DOCS_WEBHOOK_KEY", "clave");
  vi.stubEnv("GROKBOT_DIA_WEBHOOK_URL", "");
  vi.stubEnv("GROKBOT_DIA_WEBHOOK_KEY", "");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("avisos a los bots de vida", () => {
  it("el cuerpo nunca lleva el contenido del documento", () => {
    expect(cuerpoDocumento(DOC)).toEqual({ evento: "documento_nuevo", documento_id: "d1", nombre: "poliza.pdf", mime: "application/pdf", categoria: "Seguros", subido_en: "2026-11-05T10:00:00Z" });
  });
  it("manda la clave y solo los datos del archivo", async () => {
    const f = vi.fn(async () => new Response("ok"));
    vi.stubGlobal("fetch", f);
    await enviarDocumentos([DOC]);
    const [url, op] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://bot.test/docs");
    expect((op.headers as Record<string, string>).Authorization).toBe("Bearer clave");
    expect(op.body).not.toContain("SECRETO");
    expect(apuntado).toEqual([]);
  });
  it("sin variables no llama a nadie ni apunta nada", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    await enviarDia("2026-11-05");
    expect(f).not.toHaveBeenCalled();
    expect(apuntado).toEqual([]);
  });
  it("si el bot falla no rompe la subida: queda apuntado", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 500 })));
    await expect(enviarDocumentos([DOC])).resolves.toBeUndefined();
    expect(apuntado[0]).toMatchObject({ bot: "documentos", nota: "El webhook respondió 500" });
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("caído"); }));
    await expect(enviarDocumentos([DOC])).resolves.toBeUndefined();
    expect(apuntado[1].nota).toBe("No se pudo llamar al webhook");
  });
});

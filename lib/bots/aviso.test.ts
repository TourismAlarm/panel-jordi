import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cabeceraAviso, cuerpoAviso, enviarAviso } from "./aviso";

const apuntado: { bot: string; tarea: string; resultado: string; nota: string }[] = [];
vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => ({
    from: () => ({
      insert: async (fila: (typeof apuntado)[number]) => {
        apuntado.push(fila);
        return { error: null };
      },
    }),
  }),
}));

const evento = { evento: "material_listo", video_id: "GE_050", peticion_id: "00000000-0000-0000-0000-000000000001" } as const;

beforeEach(() => {
  apuntado.length = 0;
  vi.stubEnv("GROKBOT_WEBHOOK_URL", "https://hook.example/antonio");
  vi.stubEnv("GROKBOT_WEBHOOK_KEY", "clave-de-prueba");
  vi.stubEnv("GROKBOT_WEBHOOK_HEADER", "");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("aviso a Antonio", () => {
  it("manda el evento con cuándo y panel, y la clave en la cabecera", async () => {
    const llamada = vi.fn(async (..._a: [string, RequestInit]) => new Response("ok"));
    vi.stubGlobal("fetch", llamada);
    await enviarAviso(evento);
    const [url, init] = llamada.mock.calls[0];
    expect(url).toBe("https://hook.example/antonio");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer clave-de-prueba");
    expect(JSON.parse(init.body as string)).toMatchObject({ evento: "material_listo", video_id: "GE_050", panel: "https://panel-jordi.vercel.app" });
    expect(apuntado).toEqual([]);
  });
  it("un webhook caído no lanza y queda en la actividad, sin la clave", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("clave-de-prueba rechazada"); }));
    await expect(enviarAviso(evento)).resolves.toBe(false);
    expect(apuntado[0]).toMatchObject({ bot: "antonio", resultado: "fallo", tarea: "Aviso del panel: material_listo" });
    expect(apuntado[0].nota).not.toContain("clave-de-prueba");
  });
  it("una respuesta de error también se apunta", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 500 })));
    await enviarAviso(evento);
    expect(apuntado[0].nota).toContain("500");
  });
  it("sin variables no llama a nadie y lo apunta", async () => {
    vi.stubEnv("GROKBOT_WEBHOOK_URL", "");
    const llamada = vi.fn();
    vi.stubGlobal("fetch", llamada);
    await enviarAviso(evento);
    expect(llamada).not.toHaveBeenCalled();
    expect(apuntado[0].nota).toContain("GROKBOT_WEBHOOK_URL");
  });
  it("si falla hasta el apunte, tampoco lanza", async () => {
    vi.stubEnv("GROKBOT_WEBHOOK_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(enviarAviso(evento)).resolves.toBe(false);
  });
  it("lo que escribe Jordi sale sin datos de clientes", () => {
    const c = cuerpoAviso({ evento: "guion_cambios", guion_id: "x", nota_jordi: "Llama al 612345678" }, new Date("2026-11-03T10:00:00Z"));
    expect(c.nota_jordi).toBe("Llama al [oculto]");
    expect(c.cuando).toBe("2026-11-03T10:00:00.000Z");
  });
  it("la cabecera se configura", () => {
    expect(cabeceraAviso("k", null)).toEqual(["Authorization", "Bearer k"]);
    expect(cabeceraAviso("k", "X-Api-Key")).toEqual(["X-Api-Key", "k"]);
    expect(cabeceraAviso("k", "X-Clave: <clave>")).toEqual(["X-Clave", "k"]);
  });
  it("dice si Antonio lo ha recibido", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("ok")));
    await expect(enviarAviso({ evento: "resumen_pedido", fecha: "2026-11-05" })).resolves.toBe(true);
  });
  it("un documento nuevo no lleva contenido y su nombre sale tachado si hay datos de clientes", () => {
    const c = cuerpoAviso({ evento: "documento_nuevo", documento_id: "d1", nombre: "llamar al 612345678.pdf", mime: "application/pdf", categoria: "Seguros", subido_en: "2026-11-05T10:00:00Z" }, new Date("2026-11-05T10:00:00Z"));
    expect(Object.keys(c).sort()).toEqual(["categoria", "cuando", "documento_id", "evento", "mime", "nombre", "panel", "subido_en"]);
    expect(c.nombre).not.toContain("612345678");
  });
});

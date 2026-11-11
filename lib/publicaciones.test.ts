import { describe, expect, it } from "vitest";
import { clavePuede } from "@/lib/bots/catalogo";
import { PublicacionesIn } from "@/lib/bots/esquemas";
import { paraPublicar } from "./publicaciones";

const v = (id: string, estado: string) => ({ id, titulo: `Vídeo ${id}`, estado });
const p = (video_id: string, red: string, estado: string, fecha: string | null) => ({ video_id, red, estado, fecha });

describe("tarjeta «Para publicar»", () => {
  it("programados por fecha y, al final, los aprobados sin fecha", () => {
    const lista = paraPublicar(
      [v("GE_030", "aprobado"), v("GE_031", "aprobado"), v("GE_032", "exportado"), v("GE_033", "montando"), v("GE_034", "publicado")],
      [p("GE_031", "tiktok", "programado", "2026-11-14T19:00:00+01:00"), p("GE_031", "instagram", "programado", "2026-11-12T20:30:00+01:00"), p("GE_034", "instagram", "publicado", "2026-11-01T20:30:00+01:00")],
    );
    expect(lista.map((x) => [x.videoId, x.red])).toEqual([
      ["GE_031", "instagram"],
      ["GE_031", "tiktok"],
      ["GE_030", null],
      ["GE_032", null],
    ]);
  });
  it("un aprobado que ya salió en alguna red no vuelve como «sin fecha»", () => {
    expect(paraPublicar([v("GE_030", "aprobado")], [p("GE_030", "instagram", "publicado", null)])).toEqual([]);
  });
  it("lo programado de un vídeo que no está en la lista (descartado) no sale", () => {
    expect(paraPublicar([], [p("GE_040", "youtube", "programado", "2026-11-12T20:30:00+01:00")])).toEqual([]);
  });
});

describe("POST /api/bots/publicaciones", () => {
  const item = { video_id: "GE_033", red: "instagram", fecha: "2026-11-12T20:30:00+01:00", estado: "programado", enlace: "https://www.instagram.com/reel/X/" };
  it("acepta el cuerpo de Antonio; el enlace es opcional", () => {
    expect(PublicacionesIn.safeParse({ items: [item] }).success).toBe(true);
    expect(PublicacionesIn.safeParse({ items: [{ ...item, enlace: undefined }] }).success).toBe(true);
  });
  it("un programado lleva fecha; un publicado puede no llevarla", () => {
    expect(PublicacionesIn.safeParse({ items: [{ ...item, fecha: undefined }] }).success).toBe(false);
    expect(PublicacionesIn.safeParse({ items: [{ ...item, estado: "publicado", fecha: undefined }] }).success).toBe(true);
  });
  it("rechaza otra red, fecha sin zona y la misma pareja dos veces", () => {
    expect(PublicacionesIn.safeParse({ items: [{ ...item, red: "facebook" }] }).success).toBe(false);
    expect(PublicacionesIn.safeParse({ items: [{ ...item, fecha: "2026-11-12 20:30" }] }).success).toBe(false);
    expect(PublicacionesIn.safeParse({ items: [item, { ...item, estado: "publicado" }] }).success).toBe(false);
  });
  it("lo escribe Antonio; el PC no", () => {
    expect(clavePuede("antonio", "publicaciones:escribir")).toBe(true);
    expect(clavePuede("antonio", "publicaciones:leer")).toBe(true);
    expect(clavePuede("editor", "publicaciones:escribir")).toBe(false);
  });
});

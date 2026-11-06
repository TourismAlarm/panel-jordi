import { describe, expect, it } from "vitest";
import { clavePuede, puede } from "./catalogo";
import { FotoRedesIn, PeticionCambioIn, ReelsRedesIn } from "./esquemas";

describe("lo que antes recogía el PC", () => {
  it("lo cierra Antonio; el PC ya no", () => {
    for (const p of ["peticiones:leer", "peticiones:escribir", "redes:leer", "redes:escribir"] as const) {
      expect(puede("antonio", p)).toBe(true);
      expect(clavePuede("editor", p)).toBe(false);
    }
  });
  it("una petición fallida dice por qué", () => {
    expect(PeticionCambioIn.safeParse({ estado: "fallida" }).success).toBe(false);
    expect(PeticionCambioIn.safeParse({ estado: "fallida", error: "ese vídeo ya no existe" }).success).toBe(true);
    expect(PeticionCambioIn.safeParse({ estado: "pendiente" }).success).toBe(false);
  });
});

describe("cifras de redes", () => {
  const reel = { timestamp: "2026-07-26T18:08:35+0000", media_permalink: "https://www.instagram.com/reel/X/", media_views: 7256, media_reel_skip_rate: 0.279 };
  it("acepta la fila de Windsor tal cual, con campos de más", () => {
    expect(FotoRedesIn.safeParse({ red: "instagram", fecha: "2026-11-06", datos: [{ ...reel, otro: 1 }] }).success).toBe(true);
  });
  it("rechaza proporciones en % y cifras negativas", () => {
    expect(FotoRedesIn.safeParse({ red: "instagram", fecha: "2026-11-06", datos: [{ ...reel, media_reel_skip_rate: 27.9 }] }).success).toBe(false);
    expect(FotoRedesIn.safeParse({ red: "instagram", fecha: "2026-11-06", datos: [{ ...reel, media_views: -1 }] }).success).toBe(false);
  });
  it("TikTok pide su id y su fecha", () => {
    expect(FotoRedesIn.safeParse({ red: "tiktok", fecha: "2026-11-06", datos: [{ video_id: "7673538595545730326", video_create_datetime: "2026-08-13T15:28:55" }] }).success).toBe(true);
    expect(FotoRedesIn.safeParse({ red: "tiktok", fecha: "2026-11-06", datos: [reel] }).success).toBe(false);
  });
  it("la ficha de un reel lleva un GE válido", () => {
    expect(ReelsRedesIn.safeParse({ items: [{ permalink: "https://www.instagram.com/reel/X/", ge: "GE_031" }] }).success).toBe(true);
    expect(ReelsRedesIn.safeParse({ items: [{ permalink: "https://www.instagram.com/reel/X/", ge: "31" }] }).success).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { conclusiones, construirReels, mediana, tituloDe, type Foto, type ReelWindsor } from "./redes";

const reel = (url: string, ts: string, vistas: number, salto: number, extra: Partial<ReelWindsor> = {}): ReelWindsor => ({
  timestamp: ts,
  media_permalink: url,
  media_caption: `Reel ${url} 🏗️\nsegunda línea`,
  media_views: vistas,
  media_reach: Math.round(vistas * 0.8),
  media_reel_avg_watch_time: 20000,
  media_reel_skip_rate: salto,
  media_saved: 2,
  media_shares: 1,
  media_product_type: "REELS",
  ...extra,
});

describe("redes", () => {
  it("mediana", () => {
    expect(mediana([3, 1, 2])).toBe(2);
    expect(mediana([4, 1, 2, 3])).toBe(2.5);
    expect(mediana([null])).toBeNull();
  });

  it("título: primera línea sin emojis", () => {
    expect(tituloDe("Hola grúa 🏗️\nresto", null)).toBe("Hola grúa");
    expect(tituloDe("", "Gancho")).toBe("Gancho");
  });

  it("vistas de la semana con la foto de hace 7 días, quita personales y ordena por fecha", () => {
    const fotos: Foto[] = [
      { fecha: "2026-10-06", reels: [reel("a", "2026-09-01T10:00:00+0000", 1000, 0.25)] },
      {
        fecha: "2026-10-13",
        reels: [
          reel("a", "2026-09-01T10:00:00+0000", 1500, 0.25),
          reel("b", "2026-10-12T20:00:00+0000", 300, 0.4),
          reel("p", "2026-10-01T10:00:00+0000", 9000, 0.2),
        ],
      },
    ];
    const { reels, foto, diasSemana } = construirReels(fotos, [
      { permalink: "p", ge: null, tema: null, gancho: null, duracion_s: null, elsa: false },
      { permalink: "a", ge: "GE_001", tema: "nave", gancho: null, duracion_s: 40, elsa: true },
    ]);
    expect(foto).toBe("2026-10-13");
    expect(diasSemana).toBe(7);
    expect(reels.map((r) => r.permalink)).toEqual(["b", "a"]);
    const a = reels[1];
    expect(a.vistasSemana).toBe(500);
    expect(a.ge).toBe("GE_001");
    expect(a.pctVisto).toBe(50);
    expect(reels[0].vistasSemana).toBe(300); // no estaba hace 7 días: todo es de esta semana
    expect(reels[0].senales.some((s) => s.texto.startsWith("Recién publicado"))).toBe(true);
    expect(reels[0].senales.some((s) => s.tono === "mal")).toBe(true); // salto 40 %
  });

  it("conclusiones: el gancho y el ritmo", () => {
    const f: Foto = {
      fecha: "2026-10-13",
      reels: [
        reel("1", "2026-08-01T10:00:00+0000", 8000, 0.22),
        reel("2", "2026-08-10T10:00:00+0000", 7000, 0.25),
        reel("3", "2026-08-20T10:00:00+0000", 2500, 0.42),
        reel("4", "2026-09-01T10:00:00+0000", 2000, 0.45),
        reel("5", "2026-10-08T10:00:00+0000", 3000, 0.33),
      ],
    };
    const { reels } = construirReels([f], []);
    const c = conclusiones(reels, "2026-10-13");
    expect(c[0].titulo).toBe("1 reels en 30 días (objetivo 8)");
    expect(c[0].tono).toBe("mal");
    expect(c.find((x) => x.titulo.startsWith("Buen gancho"))?.texto).toContain("7.500");
  });
});

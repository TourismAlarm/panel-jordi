import { describe, expect, it } from "vitest";
import { comparar, conclusiones, conclusionesComparar, construirReels, deTikTok, emparejar, infoTikTok, leerApuestas, mediana, tituloDe, type Foto, type ReelWindsor, type VideoTikTok } from "./redes";

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
      { permalink: "p", ge: null, tema: null, gancho: null, duracion_s: null, elsa: false, tipo_gancho: null, prueba: null },
      { permalink: "a", ge: "GE_001", tema: "nave", gancho: null, duracion_s: 40, elsa: true, tipo_gancho: "cifra+problema", prueba: "A01" },
    ]);
    expect(foto).toBe("2026-10-13");
    expect(diasSemana).toBe(7);
    expect(reels.map((r) => r.permalink)).toEqual(["b", "a"]);
    const a = reels[1];
    expect(a.vistasSemana).toBe(500);
    expect(a.ge).toBe("GE_001");
    expect(a.pctVisto).toBe(50);
    expect(a.prueba).toBe("A01");
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

  it("apuestas: abiertas y cerradas con su medida", () => {
    const md = [
      "# Apuestas",
      "Formato: `- A0N · …`",
      "## Abiertas",
      "- A01 · Cierre con la cifra final · medida: ≥ 1,0 compartidos por mil a 7 d · desde 2026-10-13 · origen: informe 41",
      "## Cerradas",
      "- A00 · Algo viejo · medida: x · desde 2026-09-01",
    ].join("\n");
    const a = leerApuestas(md);
    expect(a).toHaveLength(2);
    expect(a[0]).toEqual({ id: "A01", texto: "Cierre con la cifra final", medida: "≥ 1,0 compartidos por mil a 7 d", desde: "2026-10-13", cerrada: false });
    expect(a[1].cerrada).toBe(true);
  });

  it("TikTok: se pasa a la forma de Instagram y se empareja con su reel (hora o texto)", () => {
    const tk = (id: string, ts: string, vistas: number, caption: string, entero = 0.1, dur = 90): VideoTikTok => ({
      video_id: id,
      video_create_datetime: ts,
      video_caption: caption,
      video_share_url: `https://www.tiktok.com/@jordielias5/video/${id}?utm_campaign=x`,
      video_views_count: vistas,
      video_reach: vistas * 0.9,
      video_average_time_watched: 20.5,
      video_full_watched_rate: entero,
      video_favorites: 2,
      video_shares: 1,
      video_duration: dur,
      video_new_followers: 3,
    });
    const ig: ReelWindsor[] = [
      reel("ig1", "2026-09-09T05:23:54+0000", 6204, 0.33, { media_caption: "Comprar una máquina industrial de [X] toneladas y luego acordarte de que hay que llevársela 💀" }),
      reel("ig2", "2026-09-21T19:02:03+0000", 4202, 0.3, { media_caption: "Se acabó el verano y el chiringuito también 🏖️" }),
      reel("ig3", "2026-08-13T15:27:20+0000", 5151, 0.45, { media_caption: "Montaje del xiringuito Oblikue en la playa de Vilassar 🏖️" }),
    ];
    const tt = [
      tk("1", "2026-09-08T19:53:08", 4274, "Comprar una máquina industrial de 18 toneladas y luego acordarte de que hay que llevársela 💀", 0.3, 42), // 9 h, mismo texto
      tk("2", "2026-09-21T19:04:50", 3206, "Un chiringuito no se va solo de la playa 🏖️"), // otro texto, 2 min
      tk("3", "2026-08-13T15:28:55", 806, "Montaje del xiringuito Oblikue en la playa de Vilassar 🏖️"),
      tk("4", "2026-08-16T09:15:51", 831, "Montaje del xiringuito Oblikue en la playa de Vilassar 🏖️"), // repetido: sin pareja
    ].map(deTikTok);
    expect(tt[0].media_permalink).toBe("https://www.tiktok.com/@jordielias5/video/1");
    expect(tt[0].media_reel_avg_watch_time).toBe(20500);
    expect(tt[0].timestamp).toBe("2026-09-08T19:53:08Z");
    const par = emparejar(ig, tt);
    expect(par.get(tt[0].media_permalink)).toBe("ig1");
    expect(par.get(tt[1].media_permalink)).toBe("ig2");
    expect(par.get(tt[2].media_permalink)).toBe("ig3");
    expect(par.has(tt[3].media_permalink)).toBe(false);

    const info = [{ permalink: "ig1", ge: "GE_001", tema: "nave/tanquetas", gancho: null, duracion_s: null, elsa: true, tipo_gancho: null, prueba: null }];
    const t = construirReels([{ fecha: "2026-10-16", reels: tt }], infoTikTok(par, info), "tiktok");
    const maquina = t.reels.find((r) => r.permalink.endsWith("/1"))!;
    expect(maquina.ge).toBe("GE_001");
    expect(maquina.red).toBe("tiktok");
    expect(maquina.salto).toBeNull();
    expect(maquina.completo).toBe(30);
    expect(maquina.duracion).toBe(42);
    expect(Math.round(maquina.pctVisto!)).toBe(49);
    expect(maquina.senales.some((x) => x.texto.startsWith("Lo ven entero el 30"))).toBe(true);

    const i = construirReels([{ fecha: "2026-10-16", reels: ig }], [], "instagram");
    const c = comparar(i.reels, t.reels, par);
    expect(c.parejas).toHaveLength(3);
    expect(c.soloTt).toBe(1);
    expect(c.ratio).toBeLessThan(0.8);
    expect(conclusionesComparar(c)[0].titulo).toBe("Con el mismo vídeo, Instagram saca más vistas");
  });
});

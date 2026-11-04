import { describe, expect, it } from "vitest";
import { clavePuede, puede, resolverAutor } from "./catalogo";
import { conRespuestas, preguntasNuevas, textosDeEncargo } from "./edicion";
import { EncargoIn, InformarIn } from "./esquemas";
import { revisarDatos } from "./limpieza";

const encargo = {
  video_id: "GE_044",
  fase: "acabado",
  instrucciones: { duracion_objetivo_s: 25, subtitulos: { idioma: "ca" }, audio: "solo voz" },
};

describe("permisos de la cola", () => {
  it("el editor toma, informa y lee reglas; nada más", () => {
    expect(clavePuede("editor", "edicion:tomar")).toBe(true);
    expect(clavePuede("editor", "edicion:informar")).toBe(true);
    expect(clavePuede("editor", "reglas:leer")).toBe(true);
    for (const p of ["reglas:escribir", "guiones:escribir", "ideas:escribir", "edicion:escribir", "edicion:leer", "revisiones:escribir", "videos:leer"] as const) {
      expect(clavePuede("editor", p)).toBe(false);
    }
  });
  it("Antonio encarga pero no toma ni informa", () => {
    expect(clavePuede("antonio", "edicion:escribir")).toBe(true);
    expect(clavePuede("antonio", "edicion:leer")).toBe(true);
    expect(clavePuede("antonio", "edicion:tomar")).toBe(false);
    expect(clavePuede("antonio", "edicion:informar")).toBe(false);
  });
  it("los demás bots no tocan la cola", () => {
    for (const b of ["ideas", "guionista"] as const) for (const p of ["edicion:escribir", "edicion:leer", "edicion:tomar", "edicion:informar"] as const) expect(puede(b, p)).toBe(false);
  });
  it("el editor no firma como otro", () => {
    expect(resolverAutor("editor", "antonio", "reglas:leer")).toBeNull();
  });
});

describe("lo que manda Antonio", () => {
  it("vale sin cortes y rellena lo opcional", () => {
    const e = EncargoIn.parse(encargo);
    expect(e.instrucciones.cortes).toEqual([]);
    expect(e.instrucciones.subtitulos.estilo).toBe("sistema/estilo-video.md");
  });
  it("el idioma de los subtítulos es obligatorio", () => {
    expect(EncargoIn.safeParse({ ...encargo, instrucciones: { ...encargo.instrucciones, subtitulos: {} } }).success).toBe(false);
  });
  it("una versión nueva dice qué cambia", () => {
    const reemplaza_id = "6f9619ff-8b86-4d11-b42d-00c04fc964ff";
    expect(EncargoIn.safeParse({ ...encargo, reemplaza_id }).success).toBe(false);
    expect(EncargoIn.safeParse({ ...encargo, reemplaza_id, feedback: "Más corto" }).success).toBe(true);
  });
  it("un corte con ruta o con tiempo raro no vale", () => {
    const corte = { archivo: "VID_0012.mp4", desde: "00:03.2", hasta: "00:07.8" };
    const con = (c: object) => EncargoIn.safeParse({ ...encargo, instrucciones: { ...encargo.instrucciones, cortes: [c] } }).success;
    expect(con(corte)).toBe(true);
    expect(con({ ...corte, archivo: "../secreto.mp4" })).toBe(false);
    expect(con({ ...corte, desde: "3 segundos" })).toBe(false);
  });
  it("el filtro mira los textos y no los archivos ni los tiempos", () => {
    const limpio = EncargoIn.parse({ ...encargo, instrucciones: { ...encargo.instrucciones, cortes: [{ archivo: "VID_612345678.mp4", desde: "00:03.2", hasta: "00:07.8" }] } });
    expect(revisarDatos(textosDeEncargo(limpio))).toEqual([]);
    const conDatos = EncargoIn.parse({ ...encargo, feedback: "Llama al 612 345 678", instrucciones: { ...encargo.instrucciones, notas: "cobra 300 €" } });
    expect(revisarDatos(textosDeEncargo(conDatos)).map((h) => h.campo).sort()).toEqual(["feedback", "notas"]);
  });
});

describe("lo que informa el PC", () => {
  it("cada estado pide lo suyo", () => {
    const url = "https://drive.google.com/file/d/x/view";
    expect(InformarIn.safeParse({ estado: "listo", resultado_url: url, duracion_real_s: 26 }).success).toBe(true);
    expect(InformarIn.safeParse({ estado: "listo", duracion_real_s: 26 }).success).toBe(false);
    expect(InformarIn.safeParse({ estado: "bloqueado", preguntas: [] }).success).toBe(false);
    expect(InformarIn.safeParse({ estado: "fallido" }).success).toBe(false);
    expect(InformarIn.safeParse({ estado: "final", resultado_url: url }).success).toBe(true);
    expect(InformarIn.safeParse({ estado: "aprobado" }).success).toBe(false);
  });
});

describe("responder a las preguntas del PC", () => {
  const preguntas = preguntasNuevas(["¿Qué archivo es la grúa?", "¿Quién habla?"]);
  it("con todas, vale", () => {
    expect(conRespuestas(preguntas, [{ n: 1, respuesta: "VID_1" }, { n: 2, respuesta: "Jordi" }])?.map((p) => p.respuesta)).toEqual(["VID_1", "Jordi"]);
  });
  it("si falta alguna o no existe, no", () => {
    expect(conRespuestas(preguntas, [{ n: 1, respuesta: "VID_1" }])).toBeNull();
    expect(conRespuestas(preguntas, [{ n: 1, respuesta: "a" }, { n: 2, respuesta: "b" }, { n: 3, respuesta: "c" }])).toBeNull();
  });
});

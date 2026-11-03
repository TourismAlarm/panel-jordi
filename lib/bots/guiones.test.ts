import { describe, expect, it } from "vitest";
import { buscarSeccion, fichaDeGuion, SECCION, seccionesDeGuion } from "@/lib/guion";
import { guionAMarkdown, porQueNoSeReemplaza } from "./guiones";

const guion = {
  titulo: "Jacuzzi: al ático",
  gancho: "¿Cómo sube esto\nhasta ahí?",
  planos: ["Pie del camión", { plano: "Grúa", segundos: 3 }],
  textos_pantalla: [{ texto: "4 T", segundo: 2 }],
  preguntas: ["¿Qué altura tiene?"],
  duracion_s: 25,
  tema: "Jacuzzi",
  prueba: "Precisión",
  version: 2,
};

describe("guion aprobado → guion_md", () => {
  it("lo lee lib/guion.ts: cabecera y secciones", () => {
    const md = guionAMarkdown(guion);
    expect(fichaDeGuion(md)).toMatchObject({ estadoGuion: "listo", version: "2", trabajo: "Jacuzzi" });
    const secciones = seccionesDeGuion(md);
    const lectura = buscarSeccion(secciones, SECCION.lectura)?.md ?? "";
    expect(lectura).toContain("**Gancho:** ¿Cómo sube esto hasta ahí?");
    expect(lectura).toContain("1. Pie del camión");
    expect(lectura).toContain("- Segundo 2: «4 T»");
    expect(buscarSeccion(secciones, SECCION.notas)?.md).toContain("¿Qué altura tiene?");
  });
  it("un título con dos puntos no rompe la cabecera", () => {
    expect(guionAMarkdown(guion)).toContain('titulo: "Jacuzzi: al ático"');
  });
  it("sin preguntas no hay notas", () => {
    expect(buscarSeccion(seccionesDeGuion(guionAMarkdown({ ...guion, preguntas: [] })), SECCION.notas)).toBeNull();
  });
});

describe("reemplazar un guion", () => {
  it("vale mientras está propuesto o con cambios", () => {
    expect(porQueNoSeReemplaza({ estado: "propuesto", video_id: null })).toBeNull();
    expect(porQueNoSeReemplaza({ estado: "cambios", video_id: null })).toBeNull();
  });
  it("no vale cerrado ni si ya es vídeo", () => {
    for (const estado of ["aprobado", "descartado", "sustituido"]) expect(porQueNoSeReemplaza({ estado, video_id: null })).not.toBeNull();
    expect(porQueNoSeReemplaza({ estado: "propuesto", video_id: "GE_050" })).not.toBeNull();
  });
});

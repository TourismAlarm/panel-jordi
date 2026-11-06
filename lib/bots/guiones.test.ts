import { describe, expect, it } from "vitest";
import { buscarSeccion, fichaDeGuion, SECCION, seccionesDeGuion } from "@/lib/guion";
import { esPregunta, guionAMarkdown, guionConCuerpoNuevo, porQueNoSeEditaElGuion, porQueNoSeReemplaza } from "./guiones";

const guion = {
  titulo: "Jacuzzi: al ático",
  gancho: "¿Cómo sube esto\nhasta ahí?",
  planos: ["Pie del camión", { plano: "Grúa", segundos: 3 }],
  textos_pantalla: [{ texto: "4 T", segundo: 2 }],
  preguntas: ["¿Qué altura tiene?", "¿Cuánto pesa? Tiene que ser el peso real.", "Seguridad: graba otra persona."],
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
    expect(buscarSeccion(secciones, SECCION.notas)?.md).toBe("- Seguridad: graba otra persona.");
  });
  it("un título con dos puntos no rompe la cabecera", () => {
    expect(guionAMarkdown(guion)).toContain('titulo: "Jacuzzi: al ático"');
  });
  it("solo con preguntas no hay notas: van a la ficha", () => {
    expect(buscarSeccion(seccionesDeGuion(guionAMarkdown({ ...guion, preguntas: ["¿Qué altura tiene?"] })), SECCION.notas)).toBeNull();
    expect(esPregunta("¿Cuánto pesa? Tiene que ser el real.")).toBe(true);
    expect(esPregunta("Seguridad: graba otra persona.")).toBe(false);
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

describe("meter las respuestas en el guion de un vídeo", () => {
  const md = '---\ntitulo: "Pluma"\nversion: 1\nestado: listo\n---\n\n# Guion completo\n\n[¿X?] toneladas\n';
  it("conserva la cabecera, sube la versión y cambia el cuerpo", () => {
    const nuevo = guionConCuerpoNuevo(md, "# Guion completo\n\n4 toneladas");
    expect(nuevo?.version).toBe(2);
    expect(fichaDeGuion(nuevo?.md ?? null)).toMatchObject({ version: "2", estadoGuion: "listo" });
    expect(buscarSeccion(seccionesDeGuion(nuevo?.md ?? null), SECCION.lectura)?.md).toBe("4 toneladas");
  });
  it("si el bot manda cabecera, se ignora", () => {
    expect(guionConCuerpoNuevo(md, "---\ntitulo: otro\n---\n# Guion completo\n\nx")?.md).not.toContain("otro");
  });
  it("sin guion no hay nada que actualizar", () => {
    expect(guionConCuerpoNuevo(null, "x")).toBeNull();
  });
  it("solo sin material entregado, también en los que creó el PC", () => {
    const panel = { origen: "panel", estado: "guion_listo_falta_material" };
    expect(porQueNoSeEditaElGuion(panel, false)).toBeNull();
    expect(porQueNoSeEditaElGuion({ ...panel, estado: "esperando_material" }, false)).toBeNull();
    expect(porQueNoSeEditaElGuion(panel, true)).not.toBeNull();
    expect(porQueNoSeEditaElGuion({ ...panel, origen: "pc" }, false)).toBeNull();
    expect(porQueNoSeEditaElGuion({ ...panel, estado: "montando" }, false)).not.toBeNull();
  });
});

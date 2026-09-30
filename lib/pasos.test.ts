import { describe, expect, it } from "vitest";
import type { Ficha } from "@/lib/guion";
import { pasosDe } from "./pasos";

const ficha = (estadoGuion: string | null): Ficha => ({
  hora: null, franja: null, lugar: null, camion: null, trabajo: null, version: null, estadoGuion, porConfirmar: [],
});

const video = (estado: string, guion: string | null = "listo") => ({
  id: "GE_001",
  estado,
  por_revisar: estado === "revision_jordi",
  fecha_trabajo: "2026-09-01",
  tieneGuion: guion !== null,
  ficha: ficha(guion),
});

const preguntas = (sinContestar: number, enviadas: number, total: number) => ({ total, sinContestar, enviadas });
const por = (pasos: ReturnType<typeof pasosDe>, clave: string) => pasos.find((x) => x.clave === clave);

describe("pasosDe", () => {
  it("un vídeo archivado tiene un único paso y no inventa nada", () => {
    const pasos = pasosDe(video("archivado"), preguntas(0, 0, 0));
    expect(pasos).toHaveLength(1);
    expect(pasos[0].titulo).toBe("Archivado");
  });

  it("un vídeo descartado también", () => {
    expect(pasosDe({ ...video("guion_listo_esperando_material"), descartado: true })).toHaveLength(1);
  });

  it("guion en borrador sin preguntas por contestar y con enviadas: guion en borrador y preguntas esperando al PC", () => {
    const pasos = pasosDe(video("esperando_material", "borrador"), preguntas(0, 2, 2));
    expect(por(pasos, "guion")).toMatchObject({ estado: "sistema" });
    expect(por(pasos, "guion")?.titulo).toMatch(/borrador/);
    expect(por(pasos, "preguntas")).toMatchObject({ estado: "sistema", titulo: "Enviadas · esperando al PC" });
  });

  it("guion listo y todas las preguntas recogidas: preguntas hecho", () => {
    const pasos = pasosDe(video("esperando_material", "listo"), preguntas(0, 0, 3));
    expect(por(pasos, "guion")?.estado).toBe("hecho");
    expect(por(pasos, "preguntas")?.estado).toBe("hecho");
  });

  it("preguntas sin contestar son tuyas", () => {
    expect(por(pasosDe(video("esperando_material"), preguntas(1, 1, 2)), "preguntas")?.estado).toBe("tuyo");
  });

  it("revision_jordi: revisar el montaje es tuyo", () => {
    expect(por(pasosDe(video("revision_jordi"), preguntas(0, 0, 0)), "revisar")?.estado).toBe("tuyo");
  });

  it("revision_jordi: el botón lleva a revisar dentro del panel, no a Gmail", () => {
    const accion = por(pasosDe(video("revision_jordi"), preguntas(0, 0, 0)), "revisar")?.accion;
    expect(accion?.href).toBe("/videos/GE_001#montaje");
    expect(accion?.externo).toBeUndefined();
  });

  it("publicado: todo hecho", () => {
    const pasos = pasosDe(video("publicado"), preguntas(0, 0, 2));
    expect(pasos.every((x) => x.estado === "hecho")).toBe(true);
  });

  it("aprobado: falta publicarlo; solo aprobado o exportado lo dicen", () => {
    expect(por(pasosDe(video("aprobado"), preguntas(0, 0, 0)), "publicar")?.detalle).toBe("Aprobado, falta publicarlo");
    expect(por(pasosDe(video("exportado"), preguntas(0, 0, 0)), "publicar")?.detalle).toBe("Aprobado, falta publicarlo");
  });
});

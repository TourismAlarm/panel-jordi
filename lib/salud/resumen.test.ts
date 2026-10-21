import { describe, expect, it } from "vitest";
import { construirResumen, mediaPrevia, tarjetaDe } from "./resumen";

const serie = (valores: number[], ultimo = "2026-10-21") =>
  valores.map((valor, i) => {
    const d = new Date(`${ultimo}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - (valores.length - 1 - i));
    return { fecha: d.toISOString().slice(0, 10), valor };
  });

describe("resumen de salud", () => {
  it("la media previa no cuenta el último dato", () => {
    expect(mediaPrevia(serie([7, 7, 7, 3]))).toBe(7);
    expect(mediaPrevia(serie([5]))).toBeNull();
  });
  it("dormir menos que tu media sale como peor; más pasos, como mejor", () => {
    const sueno = tarjetaDe("sueno_horas", serie([7.5, 7.5, 7.5, 7.5, 6.5]), "2026-10-21");
    expect(sueno?.valor).toBe("6,5 h");
    expect(sueno?.cambio).toEqual({ texto: "−1 h vs tu media", tono: "peor" });
    const pasos = tarjetaDe("pasos", serie([6000, 6000, 6000, 9000]), "2026-10-21");
    expect(pasos?.cambio?.tono).toBe("mejor");
  });
  it("una diferencia mínima es «como tu media»", () => {
    const fc = tarjetaDe("fc_reposo", serie([55, 55, 55, 55.2]), "2026-10-21");
    expect(fc?.cambio?.tono).toBe("igual");
  });
  it("el peso no se juzga (ni mejor ni peor)", () => {
    const peso = tarjetaDe("peso_kg", serie([80, 80, 80, 82]), "2026-10-21");
    expect(peso?.cambio?.tono).toBe("igual");
  });
  it("dice de cuándo es el dato", () => {
    expect(tarjetaDe("pasos", serie([5000], "2026-10-20"), "2026-10-21")?.detalle).toBe("ayer");
    expect(tarjetaDe("pasos", serie([5000], "2026-10-18"), "2026-10-21")?.detalle).toBe("hace 3 días");
  });
  it("sin datos no inventa nada", () => {
    expect(tarjetaDe("sueno_horas", [], "2026-10-21")).toBeNull();
    const r = construirResumen({ hoy: "2026-10-21", series: {}, registros: [], entrenos: [] });
    expect(r.tarjetas).toEqual([]);
    expect(r.lineas).toEqual([]);
    expect(r.datosDe).toBeNull();
  });
  it("marca el aviso médico si hay un registro serio reciente", () => {
    const r = construirResumen({
      hoy: "2026-10-21",
      series: { pasos: serie([5000]) },
      registros: [{ fecha: "2026-10-20", tipo: "sintoma", etiqueta: "mareo", texto: null, aviso_medico: true }],
      entrenos: [],
    });
    expect(r.avisoMedico).toBe(true);
  });
  it("cuenta los entrenos de la semana", () => {
    const r = construirResumen({
      hoy: "2026-10-21",
      series: { pasos: serie([5000]) },
      registros: [],
      entrenos: [
        { fecha: "2026-10-20", tipo: "correr", duracion_min: 40 },
        { fecha: "2026-10-18", tipo: "fuerza", duracion_min: 50 },
        { fecha: "2026-10-01", tipo: "correr", duracion_min: 30 },
      ],
    });
    expect(r.lineas).toContain("Esta semana: 2 entrenos, 90 min.");
  });
});

import { describe, expect, it } from "vitest";
import { ContextoHoyIn } from "@/lib/bots/esquemas";
import { inicioDiaMadrid } from "@/lib/fechas";
import { estadoBloque, leerCorreos, leerEventos, tocaElDia } from "./contexto";

const pasa = (c: unknown) => ContextoHoyIn.safeParse(c).success;
const cita = (x: Record<string, unknown> = {}) => ({ titulo: "Revisión de la grúa", todoElDia: false, inicio: "2026-11-05T09:00:00+01:00", fin: "2026-11-05T10:00:00+01:00", ...x });
const correo = (x: Record<string, unknown> = {}) => ({ de: "Proveedor <ventas@example.com>", asunto: "Presupuesto", resumen: "Pide confirmar", fecha: "2026-11-04T18:30:00+01:00", ...x });

describe("contexto de Hoy: forma", () => {
  it("vale con un solo bloque, y [] es revisado y vacío", () => {
    expect(pasa({ fecha: "2026-11-05", agenda: [cita()] })).toBe(true);
    expect(pasa({ fecha: "2026-11-05", correos: [] })).toBe(true);
    expect(pasa({ bot: "dia", fecha: "2026-11-05", agenda: [], correos: [correo()] })).toBe(true);
  });
  it("hace falta algún bloque, y null no sustituye a omitirlo", () => {
    expect(pasa({ fecha: "2026-11-05" })).toBe(false);
    expect(pasa({ fecha: "2026-11-05", agenda: null })).toBe(false);
    expect(pasa({ fecha: "2026-11-05", correos: null, agenda: [] })).toBe(false);
  });
  it("una fecha imposible o mal escrita no pasa; otra fecha válida sí", () => {
    expect(pasa({ fecha: "2026-02-30", agenda: [] })).toBe(false);
    expect(pasa({ fecha: "5/11/2026", agenda: [] })).toBe(false);
    expect(pasa({ fecha: "2026-11-09", agenda: [] })).toBe(true);
  });
  it("límites: 50 citas y 30 correos", () => {
    expect(pasa({ fecha: "2026-11-05", agenda: Array.from({ length: 50 }, () => cita()) })).toBe(true);
    expect(pasa({ fecha: "2026-11-05", agenda: Array.from({ length: 51 }, () => cita()) })).toBe(false);
    expect(pasa({ fecha: "2026-11-05", correos: Array.from({ length: 31 }, () => correo()) })).toBe(false);
    expect(pasa({ fecha: "2026-11-05", agenda: [cita({ titulo: "x".repeat(201) })] })).toBe(false);
    expect(pasa({ fecha: "2026-11-05", correos: [correo({ resumen: "x".repeat(281) })] })).toBe(false);
  });
});

describe("contexto de Hoy: citas", () => {
  it("una hora sin zona no se acepta: nunca se adivina", () => {
    expect(pasa({ fecha: "2026-11-05", agenda: [cita({ inicio: "2026-11-05T09:00:00", fin: null })] })).toBe(false);
    expect(pasa({ fecha: "2026-11-05", agenda: [cita({ inicio: "2026-11-05T08:00:00Z", fin: null })] })).toBe(true);
  });
  it("fin antes que inicio no pasa", () => {
    expect(pasa({ fecha: "2026-11-05", agenda: [cita({ fin: "2026-11-05T08:00:00+01:00" })] })).toBe(false);
  });
  it("todo el día va con días, no con una hora inventada", () => {
    expect(pasa({ fecha: "2026-11-05", agenda: [{ titulo: "Fiesta", todoElDia: true }] })).toBe(true);
    expect(pasa({ fecha: "2026-11-05", agenda: [{ titulo: "Feria", todoElDia: true, inicio: "2026-11-03", fin: "2026-11-07" }] })).toBe(true);
    expect(pasa({ fecha: "2026-11-05", agenda: [{ titulo: "Fiesta", todoElDia: true, inicio: "2026-11-05T00:00:00Z" }] })).toBe(false);
    expect(pasa({ fecha: "2026-11-05", agenda: [{ titulo: "Ayer", todoElDia: true, inicio: "2026-11-04", fin: "2026-11-04" }] })).toBe(false);
  });
  it("cuenta lo que se solapa con el día de Madrid: nocturnas sí, de otro día no", () => {
    const noche = cita({ inicio: "2026-11-04T23:00:00+01:00", fin: "2026-11-05T01:00:00+01:00" });
    expect(pasa({ fecha: "2026-11-05", agenda: [noche] })).toBe(true);
    expect(pasa({ fecha: "2026-11-05", agenda: [cita({ inicio: "2026-11-04T20:00:00+01:00", fin: "2026-11-05T00:00:00+01:00" })] })).toBe(false);
    expect(pasa({ fecha: "2026-11-05", agenda: [cita({ inicio: "2026-11-05T23:30:00Z", fin: null })] })).toBe(false); // ya es día 6 en Madrid
  });
  it("cambio de hora de octubre: el día empieza a +02:00 y acaba a +01:00", () => {
    expect(inicioDiaMadrid("2026-10-25")).toBe("2026-10-25T00:00:00+02:00");
    expect(inicioDiaMadrid("2026-10-26")).toBe("2026-10-26T00:00:00+01:00");
    expect(inicioDiaMadrid("2026-03-29")).toBe("2026-03-29T00:00:00+01:00"); // marzo: a las 2 pasa a +02:00
    expect(inicioDiaMadrid("2026-03-30")).toBe("2026-03-30T00:00:00+02:00");
    const ev = (inicio: string) => leerEventos([{ titulo: "x", todoElDia: false, inicio, fin: null }])[0];
    expect(tocaElDia(ev("2026-10-25T23:30:00+01:00"), "2026-10-25")).toBe(true);
    expect(tocaElDia(ev("2026-10-24T23:30:00+02:00"), "2026-10-25")).toBe(false);
    expect(tocaElDia(ev("2026-10-25T00:10:00+02:00"), "2026-10-25")).toBe(true);
  });
});

describe("contexto de Hoy: correo", () => {
  it("una selección: vale un correo de ayer y un remitente con su dirección", () => {
    expect(pasa({ fecha: "2026-11-05", correos: [correo()] })).toBe(true);
    expect(pasa({ fecha: "2026-11-05", correos: [correo({ fecha: null, resumen: undefined })] })).toBe(true);
  });
  it("la fecha del correo lleva zona, o null", () => {
    expect(pasa({ fecha: "2026-11-05", correos: [correo({ fecha: "2026-11-04 18:30" })] })).toBe(false);
  });
  it("el HTML se guarda como texto: React lo enseña escapado", () => {
    expect(leerCorreos([correo({ asunto: "<b>Hola</b>" })])[0].asunto).toBe("<b>Hola</b>");
  });
});

describe("lectura y estados de cada bloque", () => {
  it("lo guardado que no encaja se descarta sin romper la portada", () => {
    expect(leerEventos([cita(), { titulo: "" }, "x"])).toHaveLength(1);
    expect(leerEventos(null)).toEqual([]);
    expect(leerCorreos({ no: "lista" })).toEqual([]);
  });
  it("sin publicar, publicado vacío o con lista son tres cosas distintas", () => {
    expect(estadoBloque(null, [])).toBe("no-disponible");
    expect(estadoBloque("2026-11-05T07:00:00Z", [])).toBe("vacio");
    expect(estadoBloque("2026-11-05T07:00:00Z", [1])).toBe("lista");
  });
});

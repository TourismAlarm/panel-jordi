import { describe, expect, it } from "vitest";
import { clavePuede, resolverAutor } from "./catalogo";
import { ActividadIn, GuionIn, IdeaIn, RevisionIn } from "./esquemas";
import { datosDeCliente, guionParaBot, revisarDatos, tacharDatos } from "./limpieza";

describe("una sola clave: quién firma", () => {
  it("Antonio firma como quien diga, si ese bot hace eso", () => {
    expect(resolverAutor("antonio", "ideas", "ideas:escribir")).toBe("ideas");
    expect(resolverAutor("antonio", "guionista", "guiones:escribir")).toBe("guionista");
    expect(resolverAutor("antonio", "ideas", "guiones:escribir")).toBeNull();
    expect(resolverAutor("antonio", "guionista", "revisiones:escribir")).toBeNull();
  });
  it("sin bot, firma el dueño de la clave", () => {
    expect(resolverAutor("antonio", undefined, "actividad:escribir")).toBe("antonio");
    expect(resolverAutor("ideas", undefined, "ideas:escribir")).toBe("ideas");
  });
  it("otra clave no puede firmar como otro bot", () => {
    expect(resolverAutor("ideas", "antonio", "actividad:escribir")).toBeNull();
    expect(resolverAutor("ideas", undefined, "guiones:escribir")).toBeNull();
    expect(clavePuede("ideas", "videos:leer")).toBe(false);
  });
  it("la clave de Antonio llega a todo lo de los bots", () => {
    expect(clavePuede("antonio", "ideas:escribir")).toBe(true);
    expect(clavePuede("antonio", "guiones:escribir")).toBe(true);
  });
  it("el campo bot solo admite bots conocidos", () => {
    const base = { tarea: "t", inicio: "2026-11-03T08:00:00Z", resultado: "ok" };
    expect(ActividadIn.safeParse({ ...base, bot: "ideas" }).success).toBe(true);
    expect(ActividadIn.safeParse({ ...base, bot: "otro" }).success).toBe(false);
  });
});

describe("datos de clientes", () => {
  it("detecta teléfono, correo, IBAN, DNI, precio, presupuesto y dirección", () => {
    expect(datosDeCliente("Llámame al 612 345 678")).toContain("teléfono");
    expect(datosDeCliente("+34 972123456")).toContain("teléfono");
    expect(datosDeCliente("pepe@empresa.com")).toContain("correo");
    expect(datosDeCliente("ES91 2100 0418 4502 0005 1332")).toContain("IBAN");
    expect(datosDeCliente("12345678Z")).toContain("DNI o CIF");
    expect(datosDeCliente("Cuesta 1.200 €")).toContain("precio");
    expect(datosDeCliente("presupuesto nº 4521")).toContain("nº de presupuesto");
    expect(datosDeCliente("en la calle Mayor, 12")).toContain("dirección");
  });
  it("deja pasar lo normal", () => {
    expect(datosDeCliente("Grúa de 40 toneladas sube un jacuzzi a un ático en 30 segundos")).toEqual([]);
    expect(datosDeCliente("El reel tuvo 120000 visitas en 2026")).toEqual([]);
  });
  it("no mira los enlaces y dice en qué campo está", () => {
    expect(revisarDatos({ referencias: ["https://www.tiktok.com/@a/video/612345678901"] })).toEqual([]);
    expect(revisarDatos({ planos: ["ok", "tel 612345678"] })).toEqual([{ campo: "planos[1]", datos: ["teléfono"] }]);
  });
  it("lo que sale hacia un bot va sin cabecera y tachado", () => {
    const md = "---\nlugar: Casa de Pepe\n---\n# Guion\nLlamar al 612345678 antes";
    expect(guionParaBot(md)).toBe("# Guion\nLlamar al [oculto] antes");
    expect(tacharDatos("cuesta 50 euros")).toBe("cuesta [oculto]");
    expect(guionParaBot(null)).toBeNull();
  });
});

describe("contrato de ideas, guiones y revisiones", () => {
  const uuid = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  it("una idea solo lleva referencias web", () => {
    expect(IdeaIn.safeParse({ titulo: "t", gancho: "g", referencias: ["https://a.com"] }).success).toBe(true);
    expect(IdeaIn.safeParse({ titulo: "t", gancho: "g", referencias: ["javascript:alert(1)"] }).success).toBe(false);
  });
  it("un guion necesita idea: el Guionista trabaja solo desde ideas", () => {
    const g = { titulo: "t", gancho: "g", planos: ["uno"] };
    expect(GuionIn.safeParse(g).success).toBe(false);
    expect(GuionIn.safeParse({ ...g, idea_id: uuid }).success).toBe(true);
  });
  it("una revisión es coherente", () => {
    const regla = { clave: "R0001", estado: "cumple" };
    const mal = { clave: "R0001", estado: "no_cumple", evidencia: "segundo 12" };
    expect(RevisionIn.safeParse({ fase: "corte", video_id: "GE_012", resultado: "ok", por_regla: [regla] }).success).toBe(true);
    expect(RevisionIn.safeParse({ fase: "guion", guion_id: uuid, resultado: "cambios", por_regla: [mal] }).success).toBe(true);
    expect(RevisionIn.safeParse({ fase: "corte", guion_id: uuid, resultado: "ok", por_regla: [regla] }).success).toBe(false);
    expect(RevisionIn.safeParse({ fase: "corte", video_id: "GE_012", resultado: "ok", por_regla: [mal] }).success).toBe(false);
    expect(RevisionIn.safeParse({ fase: "corte", video_id: "GE_012", resultado: "cambios", por_regla: [{ clave: "R0001", estado: "no_cumple" }] }).success).toBe(false);
  });
});

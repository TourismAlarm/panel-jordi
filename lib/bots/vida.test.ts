import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { leerPrioridades } from "@/lib/hoy/prioridades";
import { clavePuede, moduloDeBot, puede, resolverAutor, type Bot, type Permiso } from "./catalogo";
import { FechaIso, FichaBotIn, InformeIn, ResumenHoyIn } from "./esquemas";
import { cobrosDeducidos, gastoPorCategoria, ocultarIban, proximaCuota, type Movimiento } from "./vida";

const PRIVADOS: Permiso[] = ["finanzas:resumen", "finanzas:leer", "finanzas:informe", "finanzas:proponer", "salud:leer", "salud:escribir", "salud:informe", "documentos:vencimientos", "documentos:leer", "documentos:ficha"];

describe("permisos de los bots de vida", () => {
  it("ideas y guionista no llegan a dinero, salud ni documentos", () => {
    for (const bot of ["ideas", "guionista"] as Bot[]) {
      for (const p of PRIVADOS) {
        expect(puede(bot, p)).toBe(false);
        expect(clavePuede(bot, p)).toBe(false);
        expect(resolverAutor("antonio", bot, p)).toBeNull();
      }
    }
  });
  it("con la clave de Antonio se firma como cada bot, solo en lo suyo", () => {
    expect(resolverAutor("antonio", "finanzas", "finanzas:leer")).toBe("finanzas");
    expect(resolverAutor("antonio", "salud", "salud:leer")).toBe("salud");
    expect(resolverAutor("antonio", "documentos", "documentos:ficha")).toBe("documentos");
    expect(resolverAutor("antonio", "dia", "hoy:escribir")).toBe("dia");
    expect(resolverAutor("antonio", "finanzas", "salud:leer")).toBeNull();
    expect(resolverAutor("antonio", "salud", "finanzas:leer")).toBeNull();
  });
  it("Día solo lee el resumen de dinero y los vencimientos", () => {
    expect(puede("dia", "finanzas:resumen")).toBe(true);
    expect(puede("dia", "documentos:vencimientos")).toBe(true);
    for (const p of ["finanzas:leer", "documentos:leer", "salud:leer"] as Permiso[]) expect(puede("dia", p)).toBe(false);
  });
  it("Salud guarda lo de Garmin, no escribe en la memoria común y sus avisos van a Salud", () => {
    expect(puede("salud", "salud:escribir")).toBe(true);
    expect(puede("finanzas", "salud:escribir")).toBe(false);
    expect(puede("salud", "memoria:escribir")).toBe(false);
    expect(moduloDeBot("salud")).toBe("salud");
    expect(moduloDeBot("ideas")).toBe("elsa");
  });
  it("el PC sigue sin ver nada de esto", () => {
    for (const p of PRIVADOS) expect(puede("editor", p)).toBe(false);
  });
});

describe("esquemas", () => {
  it("una fecha imposible no pasa", () => {
    expect(FechaIso.safeParse("2026-02-30").success).toBe(false);
    expect(FechaIso.safeParse("2026-02-28").success).toBe(true);
  });
  it("el resumen rechaza niveles inventados y enlaces peligrosos", () => {
    const base = { fecha: "2026-11-05", resumen: "x" };
    expect(ResumenHoyIn.safeParse({ ...base, prioridades: [{ nivel: "urgente", texto: "a", enlace: "/finanzas" }] }).success).toBe(true);
    expect(ResumenHoyIn.safeParse({ ...base, prioridades: [{ nivel: "ya", texto: "a" }] }).success).toBe(false);
    expect(ResumenHoyIn.safeParse({ ...base, prioridades: [{ nivel: "urgente", texto: "a", enlace: "javascript:alert(1)" }] }).success).toBe(false);
    expect(ResumenHoyIn.safeParse({ ...base, prioridades: [{ nivel: "urgente", texto: "a", enlace: "//fuera.com" }] }).success).toBe(false);
  });
  it("un informe con el periodo al revés no pasa", () => {
    expect(InformeIn.safeParse({ tipo: "m", titulo: "t", cuerpo_md: "c", periodo_desde: "2026-02-01", periodo_hasta: "2026-01-01" }).success).toBe(false);
  });
  it("la ficha necesita una categoría del panel", () => {
    expect(FichaBotIn.safeParse({ categoria: "Seguros" }).success).toBe(true);
    expect(FichaBotIn.safeParse({ categoria: "Otra" }).success).toBe(false);
  });
});

describe("cálculos", () => {
  it("oculta el IBAN, con o sin espacios", () => {
    expect(ocultarIban("Pago a ES91 2100 0418 4502 0005 1332 ok")).toBe("Pago a ···1332 ok");
    expect(ocultarIban("ES9121000418450200051332")).toBe("···1332");
    expect(ocultarIban("MERCADONA 1234")).toBe("MERCADONA 1234");
    expect(ocultarIban(null)).toBeNull();
  });
  it("próxima cuota: hoy cuenta, y en febrero cae el último día", () => {
    expect(proximaCuota("2026-11-05", 5)).toBe("2026-11-05");
    expect(proximaCuota("2026-11-06", 5)).toBe("2026-12-05");
    expect(proximaCuota("2026-12-20", 5)).toBe("2027-01-05");
    expect(proximaCuota("2026-02-10", 31)).toBe("2026-02-28");
    expect(proximaCuota("2026-11-05", null)).toBeNull();
  });
  it("lo que no tiene categoría va por contraparte y las transferencias no son gasto", () => {
    const m = (x: Partial<Movimiento>) => ({ id: "1", date: "2026-11-01", type: "expense", amount: 10, importe: 10, kind: "regular", account_id: null, categoria: null, contraparte: null, ...x }) as Movimiento;
    const r = gastoPorCategoria([m({ categoria: "Casa", importe: 30, amount: 30 }), m({ categoria: "Casa", importe: 20, amount: 20 }), m({ contraparte: "BAR PEPE" }), m({ kind: "transfer", categoria: "Casa", importe: 999, amount: 999 }), m({ type: "income", importe: 500, amount: 500 })]);
    expect(r.total).toBe(60);
    expect(r.por_categoria).toEqual([{ categoria: "Casa", importe: 50, movimientos: 2 }]);
    expect(r.sin_categoria_por_contraparte).toEqual([{ contraparte: "BAR PEPE", importe: 10, movimientos: 1 }]);
  });
  it("un cobro se deduce de dos meses, no de un ingreso suelto", () => {
    const r = cobrosDeducidos(
      [
        { fecha: "2026-09-26", importe: 1500, contraparte: "NOMINA ELSA" },
        { fecha: "2026-10-27", importe: 1600, contraparte: "NOMINA ELSA" },
        { fecha: "2026-10-02", importe: 900, contraparte: "UNA VEZ" },
        { fecha: "2026-09-02", importe: 20, contraparte: "POCO" },
        { fecha: "2026-10-02", importe: 20, contraparte: "POCO" },
      ],
      "2026-11-05",
    );
    expect(r).toEqual([{ contraparte: "NOMINA ELSA", importe_medio: 1550, dia_habitual: 27, ultimo: "2026-10-27", proximo_estimado: "2026-11-27" }]);
  });
  it("Hoy lee las prioridades del cron y las del bot", () => {
    expect(leerPrioridades(["Subir"])).toEqual([{ texto: "Subir" }]);
    expect(leerPrioridades([{ nivel: "urgente", texto: "Pagar", enlace: "/finanzas" }, { texto: "x", enlace: "javascript:1" }, 3])).toEqual([{ nivel: "urgente", texto: "Pagar", enlace: "/finanzas" }, { texto: "x" }]);
    expect(leerPrioridades(null)).toEqual([]);
  });
});

describe("las rutas de los bots nunca escriben en dinero ni borran", () => {
  const archivos = (dir: string): string[] => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? archivos(join(dir, f)) : f.endsWith(".ts") ? [join(dir, f)] : []));
  const rutas = [...archivos("app/api/bots"), "lib/bots/informes.ts", "lib/bots/salud-lectura.ts"];
  // Única excepción: fin_propuestas_categoria, donde el bot deja propuestas que solo Jordi aplica. Los movimientos no los toca.
  it("ninguna toca fin_* para escribir", () => {
    for (const a of rutas) {
      for (const consulta of readFileSync(a, "utf8").split(/(?=\.from\()/)) {
        if (/^\.from\(\s*["'](fin_(?!propuestas_categoria["'])|transactions|categories|accounts|loans)/.test(consulta)) expect(consulta, a).not.toMatch(/\.(insert|update|upsert|delete)\(/);
      }
    }
  });
  it("ninguna borra", () => {
    for (const a of rutas) expect(readFileSync(a, "utf8"), a).not.toMatch(/\.delete\(|\.remove\(/);
  });
});

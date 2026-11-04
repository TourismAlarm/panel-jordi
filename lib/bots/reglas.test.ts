import { describe, expect, it } from "vitest";
import { clavePuede, puede, resolverAutor } from "./catalogo";
import { ReglaCambioIn, ReglaIn, ReglaRetirarIn } from "./esquemas";
import { falloDeRegla, quienYQue, seDeshace, ultimosCambios } from "./reglas";

describe("quién puede cambiar reglas", () => {
  it("solo la clave de Antonio", () => {
    expect(clavePuede("antonio", "reglas:escribir")).toBe(true);
    expect(clavePuede("ideas", "reglas:escribir")).toBe(false);
    expect(clavePuede("guionista", "reglas:escribir")).toBe(false);
  });
  it("Antonio no puede firmar como otro para cambiarlas", () => {
    expect(puede("guionista", "reglas:escribir")).toBe(false);
    expect(resolverAutor("antonio", "guionista", "reglas:escribir")).toBeNull();
  });
  it("todos siguen pudiendo leerlas", () => {
    for (const b of ["antonio", "ideas", "guionista"] as const) expect(puede(b, "reglas:leer")).toBe(true);
  });
});

describe("lo que manda Antonio", () => {
  const regla = { agente: "montador", regla: "Gancho antes del segundo 2", por_que: "GE_040 retuvo más", evidencia: "GE_040" };
  it("crear pide el porqué y la evidencia; la medida es opcional", () => {
    expect(ReglaIn.safeParse(regla).success).toBe(true);
    expect(ReglaIn.safeParse({ ...regla, evidencia: undefined }).success).toBe(false);
    expect(ReglaIn.safeParse({ ...regla, por_que: " " }).success).toBe(false);
  });
  it("vale para los agentes nuevos y no para uno inventado", () => {
    expect(ReglaIn.safeParse({ ...regla, agente: "ideas" }).success).toBe(true);
    expect(ReglaIn.safeParse({ ...regla, agente: "antonio" }).success).toBe(true);
    expect(ReglaIn.safeParse({ ...regla, agente: "otro" }).success).toBe(false);
  });
  it("cambiar y retirar sin porqué no valen", () => {
    expect(ReglaCambioIn.safeParse({ regla: "x" }).success).toBe(false);
    expect(ReglaRetirarIn.safeParse({}).success).toBe(false);
  });
});

describe("último cambio de cada regla", () => {
  const c = (regla_id: string, accion: string, quien = "antonio") => ({ regla_id, accion, quien });
  it("se queda con el más nuevo", () => {
    const u = ultimosCambios([c("a", "editar"), c("b", "crear"), c("a", "crear")]);
    expect(u.get("a")?.accion).toBe("editar");
    expect(u.size).toBe(2);
  });
  it("un deshacer no se deshace, y sin historial tampoco hay nada que deshacer", () => {
    expect(seDeshace(c("a", "editar"))).toBe(true);
    expect(seDeshace(c("a", "deshacer"))).toBe(false);
    expect(seDeshace(undefined)).toBe(false);
  });
  it("dice quién hizo qué", () => {
    expect(quienYQue(c("a", "editar"))).toBe("Cambiada por Antonio");
    expect(quienYQue(c("a", "retirar", "jordi"))).toBe("Quitada por ti");
  });
});

describe("errores de las funciones de reglas", () => {
  it("no existe → 404; no se puede → 409; lo demás se lanza", () => {
    expect(falloDeRegla({ code: "P0002", message: "esa regla no existe" }).status).toBe(404);
    expect(falloDeRegla({ code: "P0001", message: "solo se edita una regla activa" }).status).toBe(409);
    expect(() => falloDeRegla({ code: "57014", message: "timeout" })).toThrow();
  });
});

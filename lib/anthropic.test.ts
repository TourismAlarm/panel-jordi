import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { pedirJSON, REGLAS_BASE } from "./anthropic";

const respuesta = (texto: string) => ({ content: [{ type: "text", text: texto }] });
const falso = (...textos: string[]) => {
  const create = vi.fn();
  textos.forEach((t) => create.mockResolvedValueOnce(respuesta(t)));
  return { cliente: { messages: { create } } as never, create };
};
const esquema = z.object({ n: z.number() });

describe("pedirJSON", () => {
  it("valida con Zod y acepta JSON dentro de un bloque de código", async () => {
    const { cliente } = falso('```json\n{"n": 3}\n```');
    expect(await pedirJSON({ system: "s", usuario: "u", esquema, cliente })).toEqual({ n: 3 });
  });
  it("reintenta si el JSON no valida y lo consigue", async () => {
    const { cliente, create } = falso('{"n": "tres"}', '{"n": 3}');
    expect(await pedirJSON({ system: "s", usuario: "u", esquema, cliente })).toEqual({ n: 3 });
    expect(create).toHaveBeenCalledTimes(2);
  });
  it("falla tras agotar los reintentos", async () => {
    const { cliente } = falso("nada", "nada", "nada");
    await expect(pedirJSON({ system: "s", usuario: "u", esquema, cliente })).rejects.toThrow(/JSON válido/);
  });
  it("incluye las reglas (sin inversión, sin diagnóstico) en cada llamada", async () => {
    const { cliente, create } = falso('{"n": 1}');
    await pedirJSON({ system: "s", usuario: "u", esquema, cliente });
    const { system } = create.mock.calls[0][0];
    expect(system).toContain(REGLAS_BASE);
    expect(REGLAS_BASE).toMatch(/inversión/);
    expect(REGLAS_BASE).toMatch(/No diagnostiques/);
  });
});

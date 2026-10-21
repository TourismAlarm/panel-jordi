import { describe, expect, it } from "vitest";
import { consultaDePregunta, validarCitas } from "./chat-puro";

describe("consultaDePregunta", () => {
  it("quita palabras vacías y une con OR", () => {
    expect(consultaDePregunta("¿Cuándo vence el seguro del camión?")).toBe("vence or seguro or camion");
  });
  it("sin contenido, vacío", () => expect(consultaDePregunta("¿y el de la?")).toBe(""));
});

describe("validarCitas", () => {
  const f = [
    { n: 1, documento_id: "a", nombre: "Póliza", pagina: 2, texto: "" },
    { n: 2, documento_id: "a", nombre: "Póliza (ficha)", pagina: null, texto: "" },
  ];
  it("ignora citas inventadas y duplicadas", () => {
    expect(validarCitas([1, 1, 9, 2], f)).toEqual([
      { documento_id: "a", nombre: "Póliza", pagina: 2 },
      { documento_id: "a", nombre: "Póliza", pagina: null },
    ]);
  });
});

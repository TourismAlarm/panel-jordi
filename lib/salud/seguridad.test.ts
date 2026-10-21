import { describe, expect, it } from "vitest";
import { necesitaAvisoMedico } from "./seguridad";

describe("aviso médico", () => {
  it("dolor agudo, mareo y similares siempre avisan", () => {
    for (const etiqueta of ["dolor_agudo", "mareo", "dolor_pecho", "falta_aire", "desmayo"]) {
      expect(necesitaAvisoMedico({ tipo: "sintoma", etiqueta })).toBe(true);
    }
  });
  it("cualquier condición médica avisa", () => {
    expect(necesitaAvisoMedico({ tipo: "condicion", texto: "hipertensión" })).toBe(true);
  });
  it("detecta palabras de alarma en el texto libre", () => {
    expect(necesitaAvisoMedico({ tipo: "nota", texto: "Esta tarde tuve un mareo al levantarme" })).toBe(true);
    expect(necesitaAvisoMedico({ tipo: "nota", texto: "dolor en el pecho al subir escaleras" })).toBe(true);
    expect(necesitaAvisoMedico({ tipo: "nota", texto: "tengo palpitaciones" })).toBe(true);
  });
  it("un dolor leve muy intenso también avisa", () => {
    expect(necesitaAvisoMedico({ tipo: "sintoma", etiqueta: "dolor_leve", intensidad: 5 })).toBe(true);
    expect(necesitaAvisoMedico({ tipo: "sintoma", etiqueta: "dolor_leve", intensidad: 2 })).toBe(false);
  });
  it("lo cotidiano no avisa", () => {
    expect(necesitaAvisoMedico({ tipo: "sintoma", etiqueta: "cansancio", intensidad: 3 })).toBe(false);
    expect(necesitaAvisoMedico({ tipo: "nota", texto: "Hoy he dormido bien y he salido a correr" })).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { aISODia, diasHasta, formatearDia, sumarDias } from "./fechas";

describe("fechas", () => {
  it("usa el día de Madrid, no el UTC", () => {
    expect(aISODia(new Date("2026-06-30T22:30:00Z"))).toBe("2026-07-01"); // 00:30 en Madrid (verano)
    expect(aISODia(new Date("2026-12-31T22:30:00Z"))).toBe("2026-12-31"); // 23:30 en Madrid (invierno)
  });
  it("cuenta días naturales, también con cambio de hora", () => {
    expect(diasHasta("2026-03-30", "2026-03-27")).toBe(3);
    expect(diasHasta("2026-01-01", "2026-01-02")).toBe(-1);
  });
  it("suma días", () => {
    expect(sumarDias("2026-02-27", 2)).toBe("2026-03-01");
  });
  it("formatea en español", () => {
    expect(formatearDia("2026-10-20")).toBe("20 de octubre de 2026");
  });
});

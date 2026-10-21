import { describe, expect, it } from "vitest";
import { correoDelResumen } from "./correo";

describe("correo del resumen", () => {
  it("escapa lo que viene de fuera", () => {
    const c = correoDelResumen(
      { fecha: "2026-10-21", fallos: [], eventos: [], senales: [{ id: "x", modulo: "correo", nivel: "hoy", titulo: "<script>alert(1)</script>", href: "/x" }] },
      { resumen: "Hola <b>", prioridades: ["a & b"] },
      "https://panel-jordi.vercel.app/",
    );
    expect(c.html).not.toContain("<script>");
    expect(c.html).toContain("&lt;script&gt;");
    expect(c.html).toContain("a &amp; b");
    expect(c.html).toContain('href="https://panel-jordi.vercel.app/x"');
  });
  it("agrupa por urgencia y avisa de los fallos", () => {
    const c = correoDelResumen(
      { fecha: "2026-10-21", fallos: ["Finanzas"], eventos: [], senales: [{ id: "a", modulo: "elsa", nivel: "urgente", titulo: "U" }, { id: "b", modulo: "elsa", nivel: "saber", titulo: "S" }] },
      { resumen: "r", prioridades: [] },
      "https://x.test",
    );
    expect(c.html.indexOf("Urgente")).toBeLessThan(c.html.indexOf("Para saber"));
    expect(c.html).toContain("No se ha podido leer: Finanzas");
  });
});

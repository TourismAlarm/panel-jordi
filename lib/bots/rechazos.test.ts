import { describe, expect, it } from "vitest";
import { agruparRechazos, detalleDeRechazo } from "./rechazos";

describe("rechazos de las llamadas de los bots", () => {
  it("el motivo es el error y su detalle, en una línea y con tope", () => {
    expect(detalleDeRechazo({ error: "datos no válidos", detalle: ["inicio: fecha no válida", "tarea: obligatorio"] })).toBe("datos no válidos · inicio: fecha no válida · tarea: obligatorio");
    expect(detalleDeRechazo({ error: "id no válido" })).toBe("id no válido");
    expect(detalleDeRechazo({ ok: true })).toBeNull();
    expect(detalleDeRechazo(null)).toBeNull();
    expect(detalleDeRechazo({ error: "x".repeat(900) })).toHaveLength(500);
  });
  it("agrupa los iguales, quita los ids de la ruta y deja fuera lo que fue bien y los 429", () => {
    const l = (ruta: string, estado: number, detalle: string | null, creado: string, metodo = "POST") => ({ metodo, ruta, estado, detalle, creado });
    const r = agruparRechazos([
      l("/api/bots/actividad", 400, "datos no válidos · inicio: mal", "2026-11-10T08:00:00Z"),
      l("/api/bots/actividad", 400, "datos no válidos · inicio: mal", "2026-11-10T10:00:00Z"),
      l("/api/bots/actividad", 201, null, "2026-11-10T11:00:00Z"),
      l("/api/bots/videos/GE_044/guion", 409, "conflicto", "2026-11-10T09:00:00Z"),
      l("/api/bots/edicion/cfb5bdb7-9146-4dcf-a70e-d519bd68a12b/informar", 409, "ese encargo no está en curso", "2026-11-10T09:30:00Z"),
      l("/api/bots/ideas", 429, "demasiadas llamadas", "2026-11-10T09:40:00Z"),
    ]);
    expect(r).toHaveLength(3);
    expect(r[0]).toMatchObject({ ruta: "/api/bots/actividad", estado: 400, veces: 2, ultima: "2026-11-10T10:00:00Z", por_que: "datos no válidos · inicio: mal" });
    expect(r.map((x) => x.ruta)).toContain("/api/bots/videos/{video}/guion");
    expect(r.map((x) => x.ruta)).toContain("/api/bots/edicion/{id}/informar");
  });
});

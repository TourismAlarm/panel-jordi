import type { Foto } from "./reunir";

// El resumen del panel, sin IA: las señales ordenadas. Lo redactado lo escribe el bot Día de Antonio y lo sustituye.
export function resumenSencillo(f: Foto) {
  const urgentes = f.senales.filter((s) => s.nivel === "urgente");
  const hoy = f.senales.filter((s) => s.nivel === "hoy");
  const partes = [
    urgentes.length ? `Urgente: ${urgentes.map((s) => s.titulo).join("; ")}.` : "Nada urgente.",
    hoy.length ? `Hoy: ${hoy.slice(0, 4).map((s) => s.titulo).join("; ")}.` : "",
    f.fallos.length ? `No se ha podido leer: ${f.fallos.join(", ")}.` : "",
  ].filter(Boolean);
  return { resumen: partes.join(" "), prioridades: [...urgentes, ...hoy].slice(0, 5).map((s) => s.titulo) };
}

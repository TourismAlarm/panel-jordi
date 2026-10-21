// Resumen de salud sin IA: cifras y comparación con tu media reciente. Lógica pura (pruebas en resumen.test.ts).
// No interpreta ni diagnostica: solo compara contigo mismo.
import { diasHasta } from "@/lib/fechas";
import { formatearValor, metrica } from "./metricas";

export type Punto = { fecha: string; valor: number };
export type Series = Record<string, Punto[]>; // cada serie ordenada por fecha ascendente

export type Tarjeta = {
  id: string;
  nombre: string;
  valor: string;
  detalle: string; // «hace 1 día», «vs. tu media»…
  cambio: { texto: string; tono: "mejor" | "peor" | "igual" } | null;
};

export type RegistroReciente = { fecha: string; tipo: string; etiqueta: string | null; texto: string | null; aviso_medico: boolean };
export type EntrenoReciente = { fecha: string; tipo: string; duracion_min: number | null };

export type ResumenSalud = {
  tarjetas: Tarjeta[];
  lineas: string[];
  avisoMedico: boolean;
  datosDe: string | null; // fecha más reciente con datos
};

const media = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null);

// Media de los 7 días anteriores al último dato (sin contarlo).
export function mediaPrevia(serie: Punto[], dias = 7): number | null {
  if (serie.length < 2) return null;
  const ultimo = serie[serie.length - 1];
  const previos = serie.filter((p) => p.fecha < ultimo.fecha && diasHasta(ultimo.fecha, p.fecha) <= dias).map((p) => p.valor);
  return media(previos);
}

function haceCuanto(dias: number): string {
  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  return `hace ${dias} días`;
}

export function tarjetaDe(id: string, serie: Punto[] | undefined, hoy: string): Tarjeta | null {
  const m = metrica(id);
  if (!m || !serie?.length) return null;
  const ultimo = serie[serie.length - 1];
  const prev = mediaPrevia(serie);
  let cambio: Tarjeta["cambio"] = null;
  if (prev !== null) {
    const d = ultimo.valor - prev;
    const umbral = Math.max(Math.abs(prev) * 0.03, m.decimales === 0 ? 0.5 : 0.05);
    if (Math.abs(d) < umbral) cambio = { texto: "como tu media", tono: "igual" };
    else {
      const signo = d > 0 ? "+" : "−";
      const abs = new Intl.NumberFormat("es-ES", { maximumFractionDigits: m.decimales }).format(Math.abs(d));
      const tono = m.mejor === "neutro" ? "igual" : (d > 0) === (m.mejor === "alto") ? "mejor" : "peor";
      cambio = { texto: `${signo}${abs} ${m.unidad} vs tu media`.trim(), tono };
    }
  }
  return {
    id,
    nombre: m.nombre,
    valor: formatearValor(id, ultimo.valor),
    detalle: haceCuanto(diasHasta(hoy, ultimo.fecha)),
    cambio,
  };
}

const CLAVE = ["sueno_horas", "pasos", "fc_reposo", "peso_kg", "animo", "energia"];

export function construirResumen(p: {
  hoy: string;
  series: Series;
  registros: RegistroReciente[];
  entrenos: EntrenoReciente[];
}): ResumenSalud {
  const tarjetas = CLAVE.map((id) => tarjetaDe(id, p.series[id], p.hoy)).filter((t): t is Tarjeta => t !== null);
  const lineas: string[] = [];

  const sueno = tarjetas.find((t) => t.id === "sueno_horas");
  if (sueno) lineas.push(`Sueño: ${sueno.valor} (${sueno.detalle})${sueno.cambio ? `, ${sueno.cambio.texto}` : ""}.`);
  const pasos = tarjetas.find((t) => t.id === "pasos");
  if (pasos) lineas.push(`Pasos: ${pasos.valor} (${pasos.detalle})${pasos.cambio ? `, ${pasos.cambio.texto}` : ""}.`);
  const fc = tarjetas.find((t) => t.id === "fc_reposo");
  if (fc) lineas.push(`Pulso en reposo: ${fc.valor}${fc.cambio ? `, ${fc.cambio.texto}` : ""}.`);

  const semana = p.entrenos.filter((e) => diasHasta(p.hoy, e.fecha) <= 7 && diasHasta(p.hoy, e.fecha) >= 0);
  if (semana.length) {
    const min = semana.reduce((s, e) => s + (e.duracion_min ?? 0), 0);
    lineas.push(`Esta semana: ${semana.length} ${semana.length === 1 ? "entreno" : "entrenos"}${min ? `, ${Math.round(min)} min` : ""}.`);
  } else if (p.entrenos.length || Object.keys(p.series).length) {
    lineas.push("Esta semana no hay entrenos registrados.");
  }

  const recientes = p.registros.filter((r) => diasHasta(p.hoy, r.fecha) <= 3);
  const avisoMedico = recientes.some((r) => r.aviso_medico);
  if (recientes.length) lineas.push(`Has apuntado ${recientes.length} ${recientes.length === 1 ? "registro" : "registros"} en los últimos 3 días.`);

  const fechas = Object.values(p.series).flatMap((s) => (s.length ? [s[s.length - 1].fecha] : []));
  const datosDe = fechas.length ? fechas.sort().at(-1)! : null;
  return { tarjetas, lineas, avisoMedico, datosDe };
}

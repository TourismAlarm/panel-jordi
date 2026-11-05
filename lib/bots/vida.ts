import { ultimos4 } from "@/lib/documentos/contrato";
import { isSpending, type FlowTx } from "@/lib/finanzas/summary/flow";

// Cálculos de los bots de vida sobre lo que ya se ha leído. Sin base de datos.

// El banco a veces escribe el IBAN en la descripción: hacia los bots solo salen los 4 últimos.
const IBAN = /\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){2,7}(?: ?[A-Z0-9]{1,3})?\b/g;
export function ocultarIban<T extends string | null>(texto: T): T {
  return (texto === null ? null : texto.replace(IBAN, (x) => ultimos4(x) ?? "···")) as T;
}

// El próximo día de cuota, contando hoy. En meses más cortos, el último día del mes.
export function proximaCuota(hoy: string, diaDePago: number | null): string | null {
  if (!diaDePago) return null;
  const [a, m, d] = hoy.split("-").map(Number);
  const fecha = (anio: number, mes: number) => {
    const dia = Math.min(diaDePago, new Date(Date.UTC(anio, mes, 0)).getUTCDate());
    return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
  };
  const esteMes = fecha(a, m);
  if (Number(esteMes.slice(8)) >= d) return esteMes;
  return m === 12 ? fecha(a + 1, 1) : fecha(a, m + 1);
}

export type Movimiento = FlowTx & { importe: number; categoria: string | null; contraparte: string | null };

const sumar = (mapa: Map<string, { importe: number; movimientos: number }>, clave: string, importe: number) => {
  const x = mapa.get(clave) ?? { importe: 0, movimientos: 0 };
  mapa.set(clave, { importe: x.importe + importe, movimientos: x.movimientos + 1 });
};
const redondear = (n: number) => Math.round(n * 100) / 100;
const ordenado = (mapa: Map<string, { importe: number; movimientos: number }>, nombre: string) =>
  [...mapa].map(([clave, v]) => ({ [nombre]: clave, importe: redondear(v.importe), movimientos: v.movimientos })).sort((a, b) => (b.importe as number) - (a.importe as number));

// Gasto real por categoría. Muchos movimientos no tienen categoría: esos van por contraparte para no perderlos.
export function gastoPorCategoria(filas: Movimiento[]) {
  const categorias = new Map<string, { importe: number; movimientos: number }>();
  const sinCategoria = new Map<string, { importe: number; movimientos: number }>();
  let total = 0;
  for (const t of filas) {
    if (!isSpending(t)) continue;
    total += t.importe;
    if (t.categoria) sumar(categorias, t.categoria, t.importe);
    else sumar(sinCategoria, t.contraparte?.trim() || "Sin contraparte", t.importe);
  }
  return { total: redondear(total), por_categoria: ordenado(categorias, "categoria"), sin_categoria_por_contraparte: ordenado(sinCategoria, "contraparte") };
}

// «Cuándo cobro», deducido: lo que entra de la misma contraparte en al menos dos meses. Las reglas de cobro están vacías.
const COBRO_MINIMO = 300;
export function cobrosDeducidos(ingresos: { fecha: string; importe: number; contraparte: string | null }[], hoy: string) {
  const grupos = new Map<string, { fecha: string; importe: number }[]>();
  for (const i of ingresos) {
    const quien = i.contraparte?.trim();
    if (!quien || i.importe < COBRO_MINIMO) continue;
    grupos.set(quien, [...(grupos.get(quien) ?? []), i]);
  }
  return [...grupos]
    .filter(([, f]) => new Set(f.map((x) => x.fecha.slice(0, 7))).size >= 2)
    .map(([contraparte, f]) => {
      const dias = f.map((x) => Number(x.fecha.slice(8))).sort((a, b) => a - b);
      const dia = dias[Math.floor(dias.length / 2)];
      return {
        contraparte,
        importe_medio: redondear(f.reduce((s, x) => s + x.importe, 0) / f.length),
        dia_habitual: dia,
        ultimo: f.map((x) => x.fecha).sort().at(-1) as string,
        proximo_estimado: proximaCuota(hoy, dia),
      };
    })
    .sort((a, b) => b.importe_medio - a.importe_medio);
}

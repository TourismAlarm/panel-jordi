import type { Punto } from "@/lib/salud/resumen";

// Dibujos de Salud en SVG puro (sin JavaScript en el móvil). El color es el del módulo.
const COLOR = "var(--mod-salud)";

// Anillo de 0 a `max` con el número dentro.
export function Anillo({ valor, max = 100, texto }: { valor: number; max?: number; texto: string }) {
  const r = 40;
  const largo = 2 * Math.PI * r;
  const parte = Math.max(0, Math.min(1, valor / max));
  return (
    <div className="relative size-24 shrink-0" role="img" aria-label={`${texto} de ${max}`}>
      <svg viewBox="0 0 96 96" className="size-full -rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="var(--superficie-2)" strokeWidth="10" />
        <circle cx="48" cy="48" r={r} fill="none" stroke={COLOR} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${parte * largo} ${largo}`} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold tabular-nums">{texto}</span>
    </div>
  );
}

// Línea pequeña con el último punto marcado. Sin ejes: solo dice hacia dónde va.
export function Chispa({ puntos }: { puntos: Punto[] }) {
  if (puntos.length < 2) return <div className="h-8" />;
  const v = puntos.map((p) => p.valor);
  const min = Math.min(...v);
  const rango = Math.max(...v) - min || 1;
  const x = (i: number) => 3 + (i / (v.length - 1)) * 94;
  const y = (n: number) => 27 - ((n - min) / rango) * 22;
  const linea = v.map((n, i) => `${x(i).toFixed(1)},${y(n).toFixed(1)}`).join(" ");
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-8 w-full" aria-hidden>
      <polygon points={`3,32 ${linea} 97,32`} fill={COLOR} opacity="0.12" />
      <polyline points={linea} fill="none" stroke={COLOR} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={x(v.length - 1)} cy={y(v[v.length - 1])} r="2.5" fill={COLOR} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

const LETRA = ["D", "L", "M", "X", "J", "V", "S"];

// Una barra por día (los últimos `dias`, acabando hoy). Un día sin dato deja el hueco. La última barra va en color lleno.
export function BarrasDias({ puntos, hoy, dias = 7, formato }: { puntos: Punto[]; hoy: string; dias?: number; formato: (v: number) => string }) {
  const porFecha = new Map(puntos.map((p) => [p.fecha, p.valor]));
  const base = new Date(`${hoy}T12:00:00Z`);
  const lista = Array.from({ length: dias }, (_, i) => {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() - (dias - 1 - i));
    const fecha = d.toISOString().slice(0, 10);
    return { fecha, letra: LETRA[d.getUTCDay()], valor: porFecha.get(fecha) ?? null };
  });
  const max = Math.max(...lista.map((d) => d.valor ?? 0), 1);
  const ultimo = [...lista].reverse().find((d) => d.valor !== null)?.fecha;
  return (
    <div className="flex items-end gap-2" role="img" aria-label={`Últimos ${dias} días`}>
      {lista.map((d) => (
        <div key={d.fecha} className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <span className="text-xs font-semibold tabular-nums text-muted-foreground">{d.valor === null ? "·" : formato(d.valor)}</span>
          <div className="flex h-16 w-full items-end">
            <div className="w-full rounded-md" style={{ height: `${d.valor === null ? 0 : Math.max(8, (d.valor / max) * 100)}%`, background: COLOR, opacity: d.fecha === ultimo ? 1 : 0.35 }} />
          </div>
          <span className={d.fecha === hoy ? "text-xs font-bold" : "text-xs text-muted-foreground"}>{d.letra}</span>
        </div>
      ))}
    </div>
  );
}

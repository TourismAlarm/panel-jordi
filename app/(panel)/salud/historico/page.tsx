import type { Metadata } from "next";
import Link from "next/link";
import { GraficaMetrica } from "@/components/salud/GraficaMetrica";
import { Card } from "@/components/shadcn/card";
import { cargarSalud } from "@/lib/datos/salud";
import { formatearDiaCorto, sumarDias } from "@/lib/fechas";
import { formatearValor, METRICAS, metrica } from "@/lib/salud/metricas";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Histórico de salud" };

const RANGOS = [7, 30, 90];

export default async function Historico({ searchParams }: PageProps<"/salud/historico">) {
  const q = await searchParams;
  const d = await cargarSalud(90);
  const disponibles = METRICAS.filter((m) => d.series[m.id]?.length);
  const id = typeof q.m === "string" && d.series[q.m]?.length ? q.m : disponibles[0]?.id;
  const rango = RANGOS.includes(Number(q.r)) ? Number(q.r) : 30;
  const pill = (on: boolean) => cn("flex min-h-12 shrink-0 items-center rounded-full border px-4 font-semibold", on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card");

  if (!id) {
    return (
      <main className="mx-auto max-w-[var(--ancho)] px-4 py-5">
        <h1 className="mb-4 text-3xl font-bold">Histórico</h1>
        <Card className="text-center text-muted-foreground">Cuando haya datos, aquí verás cómo evolucionan.</Card>
      </main>
    );
  }

  const m = metrica(id)!;
  const puntos = d.series[id].filter((p) => p.fecha >= sumarDias(d.hoy, -rango));
  const valores = puntos.map((p) => p.valor);
  const media = valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : null;
  const barras = id === "pasos" || id === "minutos_activos" || id === "calorias_activas";

  return (
    <main className="mx-auto flex max-w-[var(--ancho)] flex-col gap-4 px-4 py-5">
      <h1 className="text-3xl font-bold">Histórico</h1>

      <nav aria-label="Métrica" className="-mx-4 flex gap-2 overflow-x-auto px-4">
        {disponibles.map((x) => (
          <Link key={x.id} href={`/salud/historico?m=${x.id}&r=${rango}`} className={pill(x.id === id)}>
            {x.nombre}
          </Link>
        ))}
      </nav>
      <nav aria-label="Periodo" className="flex gap-2">
        {RANGOS.map((r) => (
          <Link key={r} href={`/salud/historico?m=${id}&r=${r}`} className={pill(r === rango)}>
            {r} días
          </Link>
        ))}
      </nav>

      <Card>
        <h2 className="mb-2 text-lg font-semibold">{m.nombre}</h2>
        {puntos.length ? <GraficaMetrica puntos={puntos} unidad={m.unidad} tipo={barras ? "barras" : "linea"} decimales={m.decimales} /> : <p className="text-muted-foreground">No hay datos en estos días.</p>}
      </Card>

      {puntos.length > 0 && (
        <section className="grid grid-cols-3 gap-3" aria-label="Resumen del periodo">
          {[
            ["Media", media],
            ["Mínimo", Math.min(...valores)],
            ["Máximo", Math.max(...valores)],
          ].map(([t, v]) => (
            <Card key={String(t)} className="text-center">
              <p className="text-sm text-muted-foreground">{t}</p>
              <p className="text-lg font-bold tabular-nums">{formatearValor(id, v as number)}</p>
            </Card>
          ))}
        </section>
      )}
      {puntos.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Último dato: {formatearDiaCorto(puntos[puntos.length - 1].fecha)}.
        </p>
      )}
    </main>
  );
}

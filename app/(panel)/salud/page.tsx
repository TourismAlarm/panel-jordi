import type { Metadata } from "next";
import Link from "next/link";
import { Activity } from "lucide-react";
import { AvisoMedico } from "@/components/salud/AvisoMedico";
import { Button } from "@/components/shadcn/button";
import { Card } from "@/components/shadcn/card";
import { cargarSalud } from "@/lib/datos/salud";
import { formatearDiaCorto, formatearFechaHora } from "@/lib/fechas";
import { construirResumen } from "@/lib/salud/resumen";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Salud" };

export default async function SaludHoy() {
  const d = await cargarSalud();
  const r = construirResumen({ hoy: d.hoy, series: d.series, registros: d.registros, entrenos: d.entrenos });
  const sinDatos = r.tarjetas.length === 0;

  return (
    <main className="mx-auto flex max-w-[var(--ancho)] flex-col gap-4 px-4 py-5">
      <header>
        <h1 className="text-3xl font-bold">Salud</h1>
        <p className="text-muted-foreground">
          {d.ultimaActualizacion ? `Datos del reloj actualizados el ${formatearFechaHora(d.ultimaActualizacion)}` : "Aún no ha llegado nada del reloj"}
        </p>
      </header>

      {r.avisoMedico && <AvisoMedico />}

      {sinDatos ? (
        <Card className="flex flex-col items-center gap-3 py-8 text-center">
          <Activity size={40} className="text-muted-foreground" />
          <p className="text-xl font-semibold">Todavía no hay datos</p>
          <p className="text-muted-foreground">
            Los datos del reloj llegan solos cuando tu proceso del PC los envíe (ver <code>docs/pc-salud.md</code>). Mientras, apunta tú cómo estás.
          </p>
        </Card>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3" aria-label="Lo importante de un vistazo">
            {r.tarjetas.map((t) => (
              <Card key={t.id} className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-muted-foreground">{t.nombre}</p>
                <p className="text-2xl font-bold tabular-nums">{t.valor}</p>
                <p className="text-sm text-muted-foreground">{t.detalle}</p>
                {t.cambio && (
                  <p className={cn("text-sm font-semibold", t.cambio.tono === "peor" && "text-destructive")}>
                    {t.cambio.tono === "mejor" ? "▲ " : t.cambio.tono === "peor" ? "▼ " : "= "}
                    {t.cambio.texto}
                  </p>
                )}
              </Card>
            ))}
          </section>
          {r.lineas.length > 0 && (
            <Card>
              <h2 className="mb-2 text-lg font-semibold">Resumen</h2>
              <ul className="flex list-disc flex-col gap-1 pl-5">
                {r.lineas.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-muted-foreground">Compara solo contigo mismo. No es un diagnóstico.</p>
            </Card>
          )}
        </>
      )}

      {d.entrenos.length > 0 && (
        <Card>
          <h2 className="mb-2 text-lg font-semibold">Últimos entrenos</h2>
          <ul className="flex flex-col divide-y divide-border">
            {d.entrenos.slice(0, 4).map((e, i) => (
              <li key={i} className="flex items-baseline justify-between py-2">
                <span className="font-semibold capitalize">{e.tipo}</span>
                <span className="text-muted-foreground">
                  {formatearDiaCorto(e.fecha)}
                  {e.duracion_min ? ` · ${Math.round(e.duracion_min)} min` : ""}
                  {e.distancia_km ? ` · ${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(e.distancia_km)} km` : ""}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Button asChild size="lg">
        <Link href="/salud/registrar">Registrar cómo estoy</Link>
      </Button>
    </main>
  );
}

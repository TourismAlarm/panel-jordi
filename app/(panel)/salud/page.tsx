import type { Metadata } from "next";
import Link from "next/link";
import { Activity } from "lucide-react";
import { UltimoInforme } from "@/components/bots/UltimoInforme";
import { AvisoMedico } from "@/components/salud/AvisoMedico";
import { Button } from "@/components/shadcn/button";
import { Card } from "@/components/shadcn/card";
import { cargarSalud } from "@/lib/datos/salud";
import { Anillo, BarrasDias, Chispa } from "@/components/salud/Visuales";
import { formatearDiaCorto, formatearFechaHora, sumarDias } from "@/lib/fechas";
import { formatearValor } from "@/lib/salud/metricas";
import { construirResumen, tarjetaDe } from "@/lib/salud/resumen";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Salud" };

export default async function SaludHoy() {
  const d = await cargarSalud();
  const r = construirResumen({ hoy: d.hoy, series: d.series, registros: d.registros, entrenos: d.entrenos });
  const sinDatos = r.tarjetas.length === 0;

  // Arriba, un solo número: la energía del reloj (o la calidad del sueño si no hay). La frase solo compara contigo mismo.
  const idPrincipal = ["body_battery", "sueno_puntuacion"].find((id) => d.series[id]?.length);
  const tPrincipal = idPrincipal ? tarjetaDe(idPrincipal, d.series[idPrincipal], d.hoy) : null;
  const principal = idPrincipal && tPrincipal
    ? {
        id: idPrincipal,
        nombre: tPrincipal.nombre,
        numero: d.series[idPrincipal].at(-1)!.valor,
        frase: !tPrincipal.cambio ? "Primer dato" : tPrincipal.cambio.tono === "mejor" ? "Por encima de tu media" : tPrincipal.cambio.tono === "peor" ? "Por debajo de tu media" : "Como tu media",
        cambio: tPrincipal.cambio && tPrincipal.cambio.tono !== "igual" ? tPrincipal.cambio.texto : null,
        detalle: tPrincipal.detalle,
      }
    : null;

  const sueno = (d.series.sueno_horas ?? []).filter((p) => p.fecha > sumarDias(d.hoy, -7));
  const mediaSueno = sueno.length ? sueno.reduce((a, p) => a + p.valor, 0) / sueno.length : null;

  // El resto de medidas con datos, cada una con su línea de las dos últimas semanas.
  const medidas = ["pasos", "fc_reposo", "hrv", "estres_medio", "sueno_puntuacion", "body_battery", "peso_kg", "animo", "energia", "minutos_activos"]
    .filter((id) => id !== idPrincipal)
    .flatMap((id) => {
      const t = tarjetaDe(id, d.series[id], d.hoy);
      return t ? [{ ...t, puntos: d.series[id].filter((p) => p.fecha > sumarDias(d.hoy, -14)) }] : [];
    });

  return (
    <main className="mx-auto flex max-w-[var(--ancho)] flex-col gap-4 px-4 py-5">
      <header>
        <h1 className="text-3xl font-bold">Salud</h1>
        <p className="text-muted-foreground">
          {d.ultimaActualizacion ? `Datos del reloj actualizados el ${formatearFechaHora(d.ultimaActualizacion)}` : "Aún no ha llegado nada del reloj"}
        </p>
      </header>

      {r.avisoMedico && <AvisoMedico />}

      <UltimoInforme bot="salud" />

      {sinDatos ? (
        <Card className="flex flex-col items-center gap-3 py-8 text-center">
          <Activity size={40} className="text-muted-foreground" />
          <p className="text-xl font-semibold">Todavía no hay datos</p>
          <p className="text-muted-foreground">
            Los datos del reloj los trae de Garmin el bot de Salud de Antonio. Mientras, apunta tú cómo estás.
          </p>
        </Card>
      ) : (
        <>
          {principal && (
            <Link href={`/salud/historico?m=${principal.id}&r=30`} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 text-inherit no-underline">
              <Anillo valor={principal.numero} texto={String(Math.round(principal.numero))} />
              <div className="min-w-0">
                <p className="text-sm font-bold" style={{ color: "var(--mod-salud)" }}>{principal.nombre}</p>
                <p className="text-xl font-bold leading-snug">{principal.frase}</p>
                <p className="text-sm text-muted-foreground">{[principal.cambio, principal.detalle].filter(Boolean).join(" · ")}</p>
              </div>
            </Link>
          )}

          {sueno.length > 0 && (
            <Link href="/salud/historico?m=sueno_horas&r=30" className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 text-inherit no-underline">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-semibold">Sueño, últimos 7 días</h2>
                {mediaSueno !== null && <p className="text-sm text-muted-foreground">Media {formatearValor("sueno_horas", mediaSueno)}</p>}
              </div>
              <BarrasDias puntos={sueno} hoy={d.hoy} formato={(v) => new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(v)} />
            </Link>
          )}

          <section className="grid grid-cols-2 gap-3" aria-label="Cómo va cada medida">
            {medidas.map((t) => (
              <Link key={t.id} href={`/salud/historico?m=${t.id}&r=30`} className="flex min-w-0 flex-col gap-1 rounded-lg border border-border bg-card p-3 text-inherit no-underline active:scale-[0.98]">
                <p className="text-sm font-semibold text-muted-foreground">{t.nombre}</p>
                <p className="text-2xl font-bold leading-tight tabular-nums">{t.valor}</p>
                <Chispa puntos={t.puntos} />
                <p className={cn("text-sm font-semibold", t.cambio?.tono === "peor" ? "text-destructive" : t.cambio?.tono === "mejor" ? "text-[var(--bien)]" : "text-muted-foreground")}>
                  {t.cambio ? `${t.cambio.tono === "mejor" ? "▲ " : t.cambio.tono === "peor" ? "▼ " : ""}${t.cambio.texto}` : t.detalle}
                </p>
              </Link>
            ))}
          </section>

          {r.lineas.length > 0 && (
            <Card>
              <details>
                <summary className="flex min-h-11 cursor-pointer items-center text-lg font-semibold">Resumen en texto</summary>
                <ul className="m-0 flex list-disc flex-col gap-1 pl-5 pt-1">
                  {r.lineas.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              </details>
              <p className="text-sm text-muted-foreground">Compara solo contigo mismo. No es un diagnóstico.</p>
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

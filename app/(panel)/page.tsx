import type { Metadata } from "next";
import Link from "next/link";
import { BotonResumen } from "@/components/hoy/BotonResumen";
import { ListaSenales } from "@/components/hoy/ListaSenales";
import { Card } from "@/components/shadcn/card";
import { supabaseServidor } from "@/lib/supabase/server";
import { formatearFechaHora } from "@/lib/fechas";
import { reunirHoy } from "@/lib/hoy/reunir";
import { hoyLargo } from "@/lib/formato";

export const metadata: Metadata = { title: "Hoy" };

const hora = (iso: string) => new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

export default async function Hoy() {
  const supabase = await supabaseServidor();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string;
  const foto = await reunirHoy(supabase, userId);

  const { data: guardado } = await supabase.from("resumenes_diarios").select("resumen, prioridades, generado_en").eq("fecha", foto.fecha).maybeSingle();
  const urgentes = foto.senales.filter((s) => s.nivel === "urgente");
  const deHoy = foto.senales.filter((s) => s.nivel === "hoy" && s.modulo !== "agenda");
  const saber = foto.senales.filter((s) => s.nivel === "saber");
  const nada = !urgentes.length && !deHoy.length && !foto.eventos.length;

  return (
    <main className="mx-auto flex max-w-[var(--ancho)] flex-col gap-5 px-4 py-5">
      <header>
        <h1 className="text-3xl font-bold">Hoy</h1>
        <p className="text-muted-foreground">{hoyLargo()}</p>
      </header>

      {foto.fallos.length > 0 && (
        <p role="alert" className="rounded-md border border-destructive/50 px-4 py-3 font-semibold text-destructive">
          No se ha podido leer: {foto.fallos.join(", ")}. El resto está al día.
        </p>
      )}

      {guardado ? (
        <Card className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Resumen de la mañana</h2>
          <p className="text-lg leading-snug">{guardado.resumen}</p>
          <p className="text-sm text-muted-foreground">Preparado el {formatearFechaHora(guardado.generado_en)}</p>
        </Card>
      ) : null}

      <ListaSenales titulo="Urgente" senales={urgentes} urgente />

      {nada && urgentes.length === 0 && (
        <Card className="py-6 text-center">
          <p className="text-xl font-semibold">Nada urgente</p>
          <p className="text-muted-foreground">Hoy no tienes nada pendiente que no pueda esperar.</p>
        </Card>
      )}

      {foto.eventos.length > 0 && (
        <section className="flex flex-col gap-2" aria-label="Agenda de hoy">
          <h2 className="text-xl font-bold">Agenda</h2>
          <Card className="flex flex-col divide-y divide-border py-1">
            {foto.eventos.map((e, i) => (
              <div key={i} className="flex min-h-14 items-center gap-4 py-2">
                <p className="w-16 shrink-0 font-bold tabular-nums">{e.todoElDia || !e.inicio ? "Todo el día" : hora(e.inicio)}</p>
                <div className="min-w-0">
                  <p className="text-lg font-semibold leading-snug">{e.titulo}</p>
                  {e.lugar && <p className="truncate text-muted-foreground">{e.lugar}</p>}
                </div>
              </div>
            ))}
          </Card>
        </section>
      )}

      <ListaSenales titulo="Para hoy" senales={deHoy} plegable />

      {foto.correos.length > 0 && (
        <section className="flex flex-col gap-2" aria-label="Correos sin leer">
          <h2 className="text-xl font-bold">Correos sin leer</h2>
          <Card className="flex flex-col divide-y divide-border py-1">
            {foto.correos.slice(0, 5).map((c, i) => (
              <div key={i} className="py-3">
                <p className="text-sm font-semibold text-muted-foreground">{c.de}</p>
                <p className="text-lg font-semibold leading-snug">{c.asunto}</p>
              </div>
            ))}
            {foto.correos.length > 5 && <p className="py-3 text-muted-foreground">y {foto.correos.length - 5} más en Gmail</p>}
          </Card>
        </section>
      )}

      {foto.google === "sin-conectar" && (
        <Card className="flex flex-col gap-2">
          <p className="text-lg font-semibold">Añade tu agenda y tu correo</p>
          <p className="text-muted-foreground">Conecta Google (solo lectura) para ver aquí tus citas de hoy y los correos sin leer.</p>
          <Link href="/ajustes" className="min-h-12 content-center font-semibold underline">
            Ir a Ajustes
          </Link>
        </Card>
      )}

      <ListaSenales titulo="Para saber" senales={saber} plegable abiertas={2} />

      <BotonResumen />
    </main>
  );
}

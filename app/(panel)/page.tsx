import type { Metadata } from "next";
import Link from "next/link";
import { BotonResumen } from "@/components/hoy/BotonResumen";
import { ListaSenales } from "@/components/hoy/ListaSenales";
import { Card } from "@/components/shadcn/card";
import { supabaseServidor } from "@/lib/supabase/server";
import { formatearFechaHora } from "@/lib/fechas";
import { estadoBloque } from "@/lib/hoy/contexto";
import { leerPrioridades } from "@/lib/hoy/prioridades";
import { reunirHoy } from "@/lib/hoy/reunir";
import { hoyLargo } from "@/lib/formato";

export const metadata: Metadata = { title: "Hoy" };

const hora = (iso: string) => new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

export default async function Hoy() {
  const supabase = await supabaseServidor();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string;
  const foto = await reunirHoy(supabase, userId);

  const guardado = foto.guardado;
  const agenda = foto.eventos.map((e) => ({ titulo: e.titulo, hora: e.todoElDia || !e.inicio ? "Todo el día" : hora(e.inicio), lugar: e.lugar, calendario: e.calendario }));
  const estadoAgenda = foto.contexto === "error" ? "error" : estadoBloque(foto.agendaEn, agenda);
  const estadoCorreo = foto.contexto === "error" ? "error" : estadoBloque(foto.correosEn, foto.correos);
  const prioridades = leerPrioridades(guardado?.prioridades);
  const urgentes = foto.senales.filter((s) => s.nivel === "urgente");
  const deHoy = foto.senales.filter((s) => s.nivel === "hoy" && s.modulo !== "agenda");
  const saber = foto.senales.filter((s) => s.nivel === "saber");
  const nada = !urgentes.length && !deHoy.length && !agenda.length;
  const actualizado = (en: string | null) => (en ? <p className="text-sm text-muted-foreground">Actualizado el {formatearFechaHora(en)}</p> : null);

  return (
    <main className="mx-auto flex max-w-[var(--ancho)] flex-col gap-5 px-4 py-5">
      <header>
        <h1 className="text-3xl font-bold">Hoy</h1>
        <p className="text-muted-foreground">{hoyLargo()}</p>
      </header>

      <Link href="/antonio" className="flex min-h-12 items-center justify-between gap-3 rounded-md border border-border px-4 py-3 text-lg font-semibold">
        <span>Antonio: lo que tiene a medias y lo que te toca</span>
        <span aria-hidden>→</span>
      </Link>

      {foto.fallos.length > 0 && (
        <p role="alert" className="rounded-md border border-destructive/50 px-4 py-3 font-semibold text-destructive">
          No se ha podido leer: {foto.fallos.join(", ")}. El resto está al día.
        </p>
      )}

      {guardado ? (
        <Card className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Resumen de la mañana</h2>
          <p className="text-lg leading-snug">{guardado.resumen}</p>
          {prioridades.length > 0 && (
            <ol className="flex list-decimal flex-col gap-1 pl-5 text-lg">
              {prioridades.map((p, i) => (
                <li key={i}>
                  {p.nivel === "urgente" && <span className="font-semibold text-destructive">Urgente: </span>}
                  {p.nivel === "futuro" && <span className="text-muted-foreground">Más adelante: </span>}
                  {p.enlace ? (
                    <a href={p.enlace} className="underline">
                      {p.texto}
                    </a>
                  ) : (
                    p.texto
                  )}
                </li>
              ))}
            </ol>
          )}
          {guardado.generado_en && <p className="text-sm text-muted-foreground">Preparado el {formatearFechaHora(guardado.generado_en)}</p>}
        </Card>
      ) : null}

      <ListaSenales titulo="Urgente" senales={urgentes} urgente />

      {nada && urgentes.length === 0 && (
        <Card className="py-6 text-center">
          <p className="text-xl font-semibold">Nada urgente</p>
          <p className="text-muted-foreground">Hoy no tienes nada pendiente que no pueda esperar.</p>
        </Card>
      )}

      <section className="flex flex-col gap-2" aria-label="Agenda de hoy">
        <h2 className="text-xl font-bold">Agenda</h2>
        {estadoAgenda === "lista" ? (
          <Card className="flex flex-col divide-y divide-border py-1">
            {agenda.map((e, i) => (
              <div key={i} className="flex min-h-14 items-center gap-4 py-2">
                <p className="w-16 shrink-0 font-bold tabular-nums">{e.hora || "Hoy"}</p>
                <div className="min-w-0">
                  <p className="text-lg font-semibold leading-snug">{e.titulo}</p>
                  {(e.lugar || e.calendario) && <p className="truncate text-muted-foreground">{[e.lugar, e.calendario].filter(Boolean).join(" · ")}</p>}
                </div>
              </div>
            ))}
          </Card>
        ) : (
          <p className="text-muted-foreground">
            {estadoAgenda === "error" ? "Agenda no disponible: no se ha podido leer." : estadoAgenda === "vacio" ? "No hay citas para este día." : "Agenda todavía no disponible."}
          </p>
        )}
        {actualizado(foto.agendaEn)}
      </section>

      <ListaSenales titulo="Para hoy" senales={deHoy} plegable />

      <section className="flex flex-col gap-2" aria-label="Selección de correo">
        <h2 className="text-xl font-bold">Selección de correo</h2>
        {estadoCorreo === "lista" ? (
          <Card className="flex flex-col divide-y divide-border py-1">
            {foto.correos.map((c, i) => (
              <div key={i} className="py-3">
                <p className="text-sm font-semibold text-muted-foreground">{c.de}</p>
                <p className="text-lg font-semibold leading-snug">{c.asunto}</p>
                {c.resumen && <p className="text-muted-foreground">{c.resumen}</p>}
              </div>
            ))}
          </Card>
        ) : (
          <p className="text-muted-foreground">
            {estadoCorreo === "error" ? "Correo no disponible: no se ha podido leer." : estadoCorreo === "vacio" ? "No hay correos en la selección." : "Selección de correo todavía no disponible."}
          </p>
        )}
        {actualizado(foto.correosEn)}
      </section>

      <ListaSenales titulo="Para saber" senales={saber} plegable abiertas={2} />

      <BotonResumen />
    </main>
  );
}

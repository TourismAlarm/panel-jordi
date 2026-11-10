import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Azulejos } from "@/components/hoy/Azulejos";
import { CosasDeHoy } from "@/components/hoy/CosasDeHoy";
import { BotonResumen } from "@/components/hoy/BotonResumen";
import { ListaSenales } from "@/components/hoy/ListaSenales";
import { Card } from "@/components/shadcn/card";
import { supabaseServidor } from "@/lib/supabase/server";
import { formatearFechaHora } from "@/lib/fechas";
import { estadoBloque } from "@/lib/hoy/contexto";
import { leerPrioridades, resueltaSola } from "@/lib/hoy/prioridades";
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
  const prioridades = leerPrioridades(guardado?.prioridades).map((p) => ({ ...p, resuelta: resueltaSola(p.enlace, foto.abierto) }));
  const urgentes = foto.senales.filter((s) => s.nivel === "urgente");
  const deHoy = foto.senales.filter((s) => s.nivel === "hoy" && s.modulo !== "agenda");
  const saber = foto.senales.filter((s) => s.nivel === "saber");
  const nada = !urgentes.length && !deHoy.length && !agenda.length;
  const actualizado = (en: string | null) => (en ? <p className="text-sm text-muted-foreground">Actualizado el {formatearFechaHora(en)}</p> : null);

  const horaMadrid = Number(new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", hour: "numeric", hour12: false }).format(new Date()));
  const saludo = horaMadrid < 6 ? "Buenas noches" : horaMadrid < 14 ? "Buenos días" : horaMadrid < 21 ? "Buenas tardes" : "Buenas noches";

  // Lo que Antonio tiene entre manos, para la franja que lleva a /antonio. Si no se puede leer, la franja sale igual, sin cifras.
  const tareas = await supabase.from("arnes_tareas").select("estado").eq("user_id", userId).in("estado", ["en_curso", "esperando_agente", "esperando_jordi"]);
  const enCurso = tareas.error ? null : tareas.data.length;
  const teEsperan = tareas.error ? 0 : tareas.data.filter((t) => t.estado === "esperando_jordi").length;
  const cuentaCosas = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;
  const lineaAntonio = [
    enCurso === null ? null : enCurso === 0 ? "Nada a medias" : cuentaCosas(enCurso, "tarea a medias", "tareas a medias"),
    teEsperan > 0 ? cuentaCosas(teEsperan, "te espera a ti", "te esperan a ti") : null,
  ].filter(Boolean).join(" · ");

  return (
    <main className="mx-auto flex max-w-[var(--ancho)] flex-col gap-5 px-4 py-5">
      <header>
        <p className="font-semibold text-muted-foreground">{hoyLargo()}</p>
        <h1 className="text-3xl font-bold">{saludo}</h1>
      </header>

      {foto.fallos.length > 0 && (
        <p role="alert" className="rounded-md border border-destructive/50 px-4 py-3 font-semibold text-destructive">
          No se ha podido leer: {foto.fallos.join(", ")}. El resto está al día.
        </p>
      )}

      {guardado && <CosasDeHoy fecha={foto.fecha} cosas={prioridades} resumen={guardado.resumen} pie={guardado.generado_en ? `Preparado el ${formatearFechaHora(guardado.generado_en)}` : null} />}

      <ListaSenales titulo="Urgente" senales={urgentes} urgente />

      {nada && urgentes.length === 0 && (
        <Card className="py-6 text-center">
          <p className="text-xl font-semibold">Nada urgente</p>
          <p className="text-muted-foreground">Hoy no tienes nada pendiente que no pueda esperar.</p>
        </Card>
      )}

      {foto.azulejos && <Azulejos datos={foto.azulejos} />}

      <section className="flex flex-col gap-2" aria-label="Agenda de hoy">
        <h2 className="text-xl font-bold">Agenda</h2>
        {estadoAgenda === "lista" ? (
          <Card className="py-4">
            <ol className="m-0 flex list-none flex-col p-0">
              {agenda.map((e, i) => (
                <li key={i} className="grid grid-cols-[4.5rem_1rem_1fr] gap-x-3">
                  <p className={e.hora.includes(":") ? "pt-0.5 text-right font-bold tabular-nums" : "pt-1 text-right text-sm font-bold leading-tight"}>{e.hora}</p>
                  <span className="relative" aria-hidden>
                    {i < agenda.length - 1 && <span className="absolute bottom-0 left-1/2 top-3 w-0.5 -translate-x-1/2 bg-border" />}
                    <span className="absolute left-1/2 top-2 size-3 -translate-x-1/2 rounded-full bg-foreground" />
                  </span>
                  <div className={i < agenda.length - 1 ? "min-w-0 pb-5" : "min-w-0"}>
                    <p className="text-lg font-semibold leading-snug">{e.titulo}</p>
                    {(e.lugar || e.calendario) && <p className="text-muted-foreground">{[e.lugar, e.calendario].filter(Boolean).join(" · ")}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        ) : (
          <p className="text-muted-foreground">
            {estadoAgenda === "error" ? "Agenda no disponible: no se ha podido leer." : estadoAgenda === "vacio" ? "No hay citas para este día." : "Agenda todavía no disponible."}
          </p>
        )}
        {actualizado(foto.agendaEn)}
      </section>

      <Link href="/antonio" className="flex min-h-16 items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-inherit no-underline active:scale-[0.99]">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-bold" aria-hidden>A</span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-semibold leading-snug">Antonio</span>
          <span className="block text-muted-foreground">{lineaAntonio || "Lo que tiene a medias y lo que te toca"}</span>
        </span>
        <ChevronRight className="shrink-0 text-muted-foreground" size={22} aria-hidden />
      </Link>

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

import type { Metadata } from "next";
import { SubNavActividad } from "@/components/actividad/SubNavActividad";
import { Fila, Lista, Pantalla, Punto, Rotulo, Seccion, Segmentos, Vacio } from "@/components/ui";
import { BOTS, IDS_BOTS, nombreBot, type Bot } from "@/lib/bots/catalogo";
import { filtrarEjecuciones, resumenBots, type FiltroDia } from "@/lib/bots/resumen";
import { actividadBots } from "@/lib/datos/bots";
import { estadoResultado } from "@/lib/estados";
import { agruparPor, diaRelativo, haceCuanto, hora, plural } from "@/lib/formato";

export const metadata: Metadata = { title: "Actividad de los bots" };

const DIAS: { id: FiltroDia; texto: string }[] = [
  { id: "hoy", texto: "Hoy" },
  { id: "ayer", texto: "Ayer" },
  { id: "semana", texto: "7 días" },
];

export default async function ActividadBots({ searchParams }: { searchParams: Promise<{ bot?: string; dia?: string }> }) {
  const q = await searchParams;
  const bot = IDS_BOTS.includes(q.bot as Bot) ? (q.bot as Bot) : undefined;
  const dia = DIAS.find((d) => d.id === q.dia)?.id;
  const url = (p: { bot?: string; dia?: string }) => {
    const params = new URLSearchParams(Object.entries(p).filter((e): e is [string, string] => !!e[1]));
    return `/elsa/actividad/bots${params.size ? `?${params}` : ""}`;
  };

  const filas = await actividadBots();
  const vistas = filtrarEjecuciones(filas, { bot, dia });

  return (
    <Pantalla titulo="Actividad" subtitulo="Los bots de Grok Bot: qué han hecho y dónde falla cada uno.">
      <SubNavActividad activa="bots" />
      <Seccion titulo="Bots">
        <Lista>
          {resumenBots(filas).map(({ bot: b, ultima, fallos7d }) => {
            const r = estadoResultado(ultima?.resultado ?? null);
            return (
              <Fila
                key={b}
                href={url({ bot: b, dia })}
                inicio={<Punto tono={ultima ? r.tono : "neutro"} titulo={ultima ? r.texto : "Aún no ha corrido"} />}
                titulo={BOTS[b].nombre}
                detalle={ultima ? `${ultima.tarea}${fallos7d ? ` · ${plural(fallos7d, "fallo")} en 7 días` : ""}` : "Aún no ha corrido"}
                fin={ultima ? haceCuanto(ultima.fin ?? ultima.inicio) : undefined}
              />
            );
          })}
        </Lista>
      </Seccion>
      <Seccion titulo="Registro">
        <Segmentos
          opciones={[
            { href: url({ dia }), texto: "Todos", activo: !bot },
            ...IDS_BOTS.map((b) => ({ href: url({ bot: b, dia }), texto: BOTS[b].nombre, activo: bot === b })),
          ]}
        />
        <Segmentos
          opciones={[
            { href: url({ bot }), texto: "Todo", activo: !dia },
            ...DIAS.map((d) => ({ href: url({ bot, dia: d.id }), texto: d.texto, activo: dia === d.id })),
          ]}
        />
        {vistas.length === 0 ? (
          <Vacio icono="reloj" tono="neutro" titulo="Sin actividad con este filtro" />
        ) : (
          agruparPor(vistas, (f) => diaRelativo(f.inicio)).map((g) => (
            <div key={g.etiqueta}>
              <Rotulo>{g.etiqueta}</Rotulo>
              <Lista>
                {g.items.map((f) => {
                  const r = estadoResultado(f.resultado);
                  return (
                    <Fila
                      key={f.id}
                      href={f.enlace ?? undefined}
                      inicio={<Punto tono={r.tono} titulo={r.texto} />}
                      titulo={`${nombreBot(f.bot)} · ${f.tarea}`}
                      detalle={f.nota}
                      fin={f.fin ? hora(f.fin) : "en marcha"}
                    />
                  );
                })}
              </Lista>
            </div>
          ))
        )}
      </Seccion>
    </Pantalla>
  );
}

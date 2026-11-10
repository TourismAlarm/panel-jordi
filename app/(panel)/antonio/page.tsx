import type { Metadata } from "next";
import { Aviso, Desplegable, Etiqueta, Fila, Lista, Pantalla, Punto, Rotulo, Seccion, Vacio, type Tono } from "@/components/ui";
import { nombreAgente } from "@/lib/arnes/agentes";
import { leerArnes } from "@/lib/arnes/leer";
import type { Pendiente, Quien, RutinaVista, TareaVista } from "@/lib/arnes/vista";
import { fecha, haceCuanto, plural } from "@/lib/formato";
import { supabaseServidor } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Antonio" };

// El arnés de Antonio: al abrirlo, todo lo que tiene entre manos. Cada fila enlaza a donde se comprueba.
// Lo que te espera a ti y lo más viejo, arriba. Una tarea sin tocar en más de 24 h sale en rojo.

const ESTADO_TAREA: Record<string, string> = { en_curso: "En curso", esperando_agente: "Esperando al agente", esperando_jordi: "Esperándote" };
const RESULTADO: Record<string, { texto: string; tono: Tono }> = { ok: { texto: "Bien", tono: "bien" }, fallo: { texto: "Falló", tono: "mal" }, nada: { texto: "Sin nada que hacer", tono: "neutro" } };
const TIPO_MEMORIA: Record<string, string> = { problema: "Problema", skill: "Skill", decision: "Decisión", preferencia: "Preferencia", hecho: "Dato" };
const ORDEN_MEMORIA = ["problema", "skill", "decision", "preferencia", "hecho"];

function aQuien(quien: Quien, agente: string) {
  if (quien === "jordi") return <Etiqueta tono="ojo">Te toca a ti</Etiqueta>;
  return <Etiqueta tono="info">{quien === "antonio" ? "Antonio" : nombreAgente(agente)}</Etiqueta>;
}

function FilaTarea({ t }: { t: TareaVista }) {
  return (
    <Fila
      href={t.enlace ?? undefined}
      inicio={<Punto tono={t.sin_tocar_24h ? "mal" : t.quien === "jordi" ? "ojo" : "info"} titulo={t.sin_tocar_24h ? "Sin tocar en más de 24 h" : ESTADO_TAREA[t.estado]} />}
      titulo={t.titulo}
      detalle={
        <>
          <span>
            {nombreAgente(t.agente)} · {ESTADO_TAREA[t.estado] ?? t.estado} · empezó {fecha(t.empezada_en)}
          </span>
          {t.paso_actual && <span>Va por: {t.paso_actual}</span>}
          {t.falta && <span>Falta: {t.falta}</span>}
          <span className="flex flex-wrap gap-2">
            {aQuien(t.quien, t.agente)}
            {t.sin_tocar_24h && <Etiqueta tono="mal">Sin tocar desde {fecha(t.actualizado_en)}</Etiqueta>}
          </span>
        </>
      }
      fin={haceCuanto(t.actualizado_en)}
    />
  );
}

function FilaPendiente({ p }: { p: Pendiente }) {
  return (
    <Fila
      href={p.enlace}
      inicio={<Punto tono={p.quien === "jordi" ? "ojo" : p.quien === "antonio" ? "info" : "neutro"} />}
      titulo={p.que}
      detalle={
        <>
          {p.detalle && <span>{p.detalle}</span>}
          <span>{aQuien(p.quien, p.agente)}</span>
        </>
      }
      fin={p.desde ? haceCuanto(p.desde) : undefined}
    />
  );
}

function FilaRutina({ r }: { r: RutinaVista }) {
  const res = r.resultado ? RESULTADO[r.resultado] : null;
  return (
    <Fila
      href="/elsa/actividad/bots?bot=antonio"
      inicio={<Punto tono={r.activa === false ? "neutro" : r.atrasada ? "mal" : (res?.tono ?? "neutro")} titulo={r.activa === false ? "En pausa" : r.atrasada ? "Atrasada" : res?.texto} />}
      titulo={r.activa === false ? `${r.nombre} · en pausa` : r.nombre}
      detalle={
        <>
          <span>{r.horario}</span>
          <span>
            Última: {r.ultima_ejecucion ? `${fecha(r.ultima_ejecucion)} · ${res?.texto ?? "sin resultado"}` : "aún no ha corrido"}
          </span>
          {r.activa !== false && <span>Próxima: {r.proxima ? fecha(r.proxima) : "sin fecha"}</span>}
          {r.atrasada && (
            <span>
              <Etiqueta tono="mal">Se ha saltado la última</Etiqueta>
            </span>
          )}
          {r.nota && <span>{r.nota}</span>}
        </>
      }
    />
  );
}

export default async function Antonio() {
  const supabase = await supabaseServidor();
  const { data } = await supabase.auth.getClaims();
  const arnes = await leerArnes(supabase, data?.claims?.sub as string);
  const tuyos = arnes.tareas.filter((t) => t.quien === "jordi").length + arnes.por_agente.reduce((n, g) => n + g.pendientes.filter((p) => p.quien === "jordi").length, 0);
  const memoria = [...arnes.memoria].sort((a, b) => ORDEN_MEMORIA.indexOf(a.tipo) - ORDEN_MEMORIA.indexOf(b.tipo));

  return (
    <Pantalla titulo="Antonio" subtitulo={tuyos ? `Lo que tiene entre manos · ${plural(tuyos, "cosa te toca", "cosas te tocan")} a ti` : "Lo que tiene entre manos"} volver={{ href: "/", texto: "Hoy" }}>
      {arnes.fallos.length > 0 && <Aviso tono="mal">No se ha podido leer: {arnes.fallos.join(", ")}. El resto está al día.</Aviso>}

      <Seccion titulo="A medias" cuenta={arnes.tareas.length}>
        {arnes.tareas.length ? (
          <Lista>
            {arnes.tareas.map((t) => (
              <FilaTarea key={t.id} t={t} />
            ))}
          </Lista>
        ) : (
          <Vacio titulo="Nada a medias" texto="Antonio no ha dejado ninguna tarea abierta." />
        )}
      </Seccion>

      <Seccion titulo="Por agente">
        <div className="flex flex-col gap-4">
          {arnes.por_agente.map((g) => (
            <div key={g.agente} className="flex flex-col gap-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Rotulo>
                  {g.nombre}
                  {g.a_medias > 0 && ` · ${g.a_medias} a medias`}
                </Rotulo>
                {g.chat && (
                  <a href={g.chat} className="text-sm font-semibold underline">
                    Abrir chat
                  </a>
                )}
              </div>
              {g.congelado ? (
                <p className="text-sm text-muted-foreground">Congelado: no tiene trabajo.</p>
              ) : g.pendientes.length ? (
                <Lista>
                  {g.pendientes.map((p) => (
                    <FilaPendiente key={p.id} p={p} />
                  ))}
                </Lista>
              ) : (
                <p className="text-sm text-muted-foreground">Nada pendiente.</p>
              )}
            </div>
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Rutinas" cuenta={arnes.rutinas.length} extra={{ texto: "Actividad", href: "/elsa/actividad/bots?bot=antonio" }}>
        {arnes.rutinas.length ? (
          <Lista>
            {arnes.rutinas.map((r) => (
              <FilaRutina key={r.id} r={r} />
            ))}
          </Lista>
        ) : (
          <Vacio titulo="Sin rutinas" texto="Antonio aún no ha dicho qué rutinas tiene." icono="reloj" tono="neutro" />
        )}
      </Seccion>

      {memoria.length > 0 && (
        <Desplegable titulo={`Para saber · ${memoria.length}`}>
          <Lista>
            {memoria.map((m) => (
              <Fila key={m.clave} titulo={m.contenido} detalle={`${TIPO_MEMORIA[m.tipo] ?? m.tipo} · ${m.clave} · ${nombreAgente(m.autor)}`} fin={haceCuanto(m.actualizado)} />
            ))}
          </Lista>
        </Desplegable>
      )}
    </Pantalla>
  );
}

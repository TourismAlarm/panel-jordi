import Link from "next/link";
import { Aviso, BotonActualizar, BotonEnlace, Desplegable, Fila, Icono, Lista, Pantalla, Punto, Rotulo, Seccion, Vacio } from "@/components/ui";
import { Embudo } from "@/components/proyectos/Embudo";
import { BotonDeshacer } from "@/components/proyectos/BotonDeshacer";
import { TarjetaProyecto } from "@/components/proyectos/TarjetaProyecto";
import { TarjetaGuion } from "@/components/bots/TarjetaGuion";
import { guionesAbiertos, revisionesDeGuiones, textosDeReglas } from "@/lib/datos/bots";
import { descartesPorVideo, listarPeticiones, materialDeVideo } from "@/lib/datos/peticiones";
import { contarEnviadas, resumenPreguntas } from "@/lib/datos/preguntas";
import { contarPorDecidir } from "@/lib/datos/reglas";
import { estadoSync } from "@/lib/datos/sync";
import { listarPublicaciones } from "@/lib/datos/publicaciones";
import { listarProyectos } from "@/lib/datos/videos";
import { estadoPeticion, faseVideo, textoMotivo } from "@/lib/estados";
import { PETICIONES_ACTIVAS } from "@/lib/funciones";
import { agruparPor, dia, diaCercano, fecha, hoyLargo, plural } from "@/lib/formato";
import { encargosAbiertos } from "@/lib/datos/encargos";
import { NOMBRE_RED, paraPublicar } from "@/lib/publicaciones";
import { embudo, etapaDe, ETAPAS, pasoActual, pasosDe, teToca, TONO_PASO } from "@/lib/pasos";

// Portada: arriba, el embudo (cuántos vídeos hay en cada etapa) y qué hace el Editor. Después, solo lo que te toca,
// con una tarjeta y un botón por vídeo; el resto va en una lista corta («En marcha»).
// Tocar una etapa del embudo deja solo sus vídeos. Después, «Para publicar» (lo programado y lo aprobado sin fecha).
// Al final, plegados, los hechos y los descartados.
export default async function Proyectos({ searchParams }: PageProps<"/elsa">) {
  const [{ ver, fase: qFase }, proyectos, preguntas, enviadas, peticiones, sync, reglas, guiones, textosReglas, cola, publicaciones] = await Promise.all([
    searchParams,
    listarProyectos(),
    resumenPreguntas(),
    contarEnviadas(),
    PETICIONES_ACTIVAS ? listarPeticiones() : Promise.resolve([]),
    estadoSync(),
    contarPorDecidir(),
    guionesAbiertos(),
    textosDeReglas(),
    encargosAbiertos(),
    listarPublicaciones(),
  ]);
  const revisionesGuion = await revisionesDeGuiones(guiones.map((g) => g.id));

  const descartes = descartesPorVideo(peticiones);
  const pedidos = peticiones.filter((x) => (x.tipo === "nuevo" || x.tipo === "sin_guion") && x.estado !== "hecha");
  const conPasos = proyectos.map((p) => ({ p, pasos: pasosDe({ ...p, descartado: descartes.has(p.id), materialListo: !!materialDeVideo(peticiones, p.id) }, preguntas.get(p.id)) }));
  const vivos = conPasos.filter(({ p }) => !descartes.has(p.id));
  const descartados = conPasos.filter(({ p }) => descartes.has(p.id));
  const abiertos = vivos.filter(({ p }) => faseVideo(p.estado) !== "hecho");
  const mios = abiertos.filter(({ pasos }) => teToca(pasos));
  const hechos = vivos.filter(({ p }) => faseVideo(p.estado) === "hecho").reverse();
  const soloMios = ver === "mios";
  const fase = ETAPAS.find((e) => e.id === qFase)?.id ?? null;
  const deFase = fase ? abiertos.filter(({ pasos }) => etapaDe(pasos) === fase) : [];
  const enMarcha = abiertos.filter(({ pasos }) => !teToca(pasos));
  const porPublicar = paraPublicar(vivos.map(({ p }) => p), publicaciones);

  // Qué hace el Editor ahora: lo que falla o pregunta va primero; si no, lo que monta; si no, lo que espera.
  const idsDe = (estado: string) => cola.filter((e) => e.estado === estado).map((e) => e.video_id);
  const [fallidos, bloqueados, montando, enCola] = ["fallido", "bloqueado", "en_curso", "pendiente"].map(idsDe);
  const editor = fallidos.length
    ? { tono: "mal" as const, texto: `Ha fallado el montaje de ${fallidos.join(", ")}`, detalle: "Lo está viendo Antonio" }
    : bloqueados.length
      ? { tono: "ojo" as const, texto: `Tiene una pregunta sobre ${bloqueados.join(", ")}`, detalle: "Se la contesta Antonio" }
      : montando.length
        ? { tono: "info" as const, texto: `Montando ${montando.join(", ")}`, detalle: enCola.length ? `${plural(enCola.length, "vídeo", "vídeos")} más en cola` : "Nada más en cola" }
        : enCola.length
          ? { tono: "neutro" as const, texto: `${plural(enCola.length, "vídeo", "vídeos")} en cola`, detalle: "Esperando a que el Editor los coja" }
          : { tono: "bien" as const, texto: "Sin nada en cola", detalle: "Todo lo encargado está entregado" };

  return (
    <Pantalla
      titulo="Proyectos"
      subtitulo={
        <>
          {hoyLargo()} · <span style={sync.ok ? undefined : { color: "var(--mal)", fontWeight: 600 }}>{sync.texto}</span>
        </>
      }
      accion={
        <>
          {PETICIONES_ACTIVAS && (
            <BotonEnlace href="/elsa/nuevo" variante="secundario" compacto>
              <Icono nombre="anadir" tamano={18} />
              Nuevo
            </BotonEnlace>
          )}
          <BotonActualizar />
        </>
      }
    >
      <Embudo tramos={embudo(abiertos)} activa={fase} />

      <Lista>
        <Fila href="/elsa/actividad/bots?bot=editor" inicio={<Punto tono={editor.tono} />} titulo={`Editor: ${editor.texto.charAt(0).toLowerCase()}${editor.texto.slice(1)}`} detalle={editor.detalle} />
      </Lista>

      {!!reglas && (
        <Aviso tono="ojo" icono="bombilla">
          <Link href="/elsa/aprendizaje">
            {plural(reglas, "cosa", "cosas")} que los agentes quieren aprender de ti: <strong>¿sí o no?</strong>
          </Link>
        </Aviso>
      )}

      {!!enviadas && (
        <Aviso tono="info">
          {plural(enviadas, "respuesta guardada", "respuestas guardadas")}. Pendiente de recoger.
        </Aviso>
      )}

      {!!guiones.length && (
        <Seccion titulo="Guiones propuestos">
          {guiones.map((g) => (
            <TarjetaGuion key={g.id} g={g} revisiones={revisionesGuion.filter((r) => r.guion_id === g.id)} reglas={textosReglas} />
          ))}
        </Seccion>
      )}

      {!!pedidos.length && (
        <Seccion titulo="Lo que has pedido">
          <Lista>
            {pedidos.map((x) => (
              <Fila
                key={x.id}
                inicio={<Icono nombre="reloj" />}
                titulo={x.texto}
                detalle={`${x.tipo === "sin_guion" ? "Sin guion, ya grabado · " : "Guion · "}${x.fecha_trabajo ? `${x.tipo === "sin_guion" ? "Del" : "Para el"} ${dia(x.fecha_trabajo)} · ` : ""}${estadoPeticion(x).texto}`}
                fin={x.estado === "pendiente" && !x.recogida_en ? <BotonDeshacer id={x.id} /> : undefined}
              />
            ))}
          </Lista>
        </Seccion>
      )}

      {fase ? (
        <Seccion titulo={ETAPAS.find((e) => e.id === fase)!.nombre} cuenta={deFase.length} extra={{ texto: "Ver todo", href: "/elsa" }}>
          {deFase.length ? (
            deFase.map(({ p, pasos }) => <TarjetaProyecto key={p.id} p={p} pasos={pasos} breve />)
          ) : (
            <Vacio icono="videos" tono="neutro" titulo="Ningún vídeo en esta etapa" texto="Toca otra etapa o «Ver todo»." />
          )}
        </Seccion>
      ) : (
        <>
          {!abiertos.length && <Vacio icono="videos" tono="neutro" titulo="No hay proyectos abiertos" texto="Aparecerán cuando Antonio cree uno." />}

          {!!abiertos.length &&
            (mios.length ? (
              <Seccion titulo="Te toca" cuenta={mios.length}>
                {agruparPor(mios, ({ p }) => diaCercano(p.fecha_trabajo)).map((g) => (
                  <section key={g.etiqueta} style={{ display: "contents" }}>
                    <Rotulo acento={g.etiqueta === "Hoy" || g.etiqueta === "Mañana"}>{g.etiqueta}</Rotulo>
                    {g.items.map(({ p, pasos }) => (
                      <TarjetaProyecto key={p.id} p={p} pasos={pasos} conFecha={false} breve />
                    ))}
                  </section>
                ))}
              </Seccion>
            ) : (
              <Vacio titulo="Nada que hacer ahora mismo" texto="El resto lo llevan Antonio y los bots." />
            ))}

          {!soloMios && !!enMarcha.length && (
            <Seccion titulo="En marcha" cuenta={enMarcha.length}>
              <Lista>
                {enMarcha.map(({ p, pasos }) => {
                  const actual = pasoActual(pasos);
                  return (
                    <Fila
                      key={p.id}
                      href={`/elsa/videos/${p.id}`}
                      inicio={<Punto tono={actual ? TONO_PASO[actual.estado] : "neutro"} />}
                      titulo={p.titulo ?? p.id}
                      detalle={[actual?.titulo, p.fecha_trabajo ? diaCercano(p.fecha_trabajo) : null].filter(Boolean).join(" · ")}
                    />
                  );
                })}
              </Lista>
            </Seccion>
          )}
        </>
      )}

      {!soloMios && !fase && !!porPublicar.length && (
        <Seccion titulo="Para publicar" cuenta={porPublicar.length}>
          <Lista>
            {porPublicar.map((x) => (
              <Fila
                key={`${x.videoId}-${x.red ?? "sin"}`}
                href={`/elsa/videos/${x.videoId}`}
                inicio={<Punto tono={x.red ? "info" : "neutro"} />}
                titulo={x.titulo}
                detalle={x.red ? `${NOMBRE_RED[x.red]} · ${fecha(x.fecha)}` : "Sin fecha"}
              />
            ))}
          </Lista>
        </Seccion>
      )}

      {!soloMios && !fase && !!hechos.length && (
        <Desplegable titulo={`Hechos (${hechos.length})`}>
          {hechos.map(({ p, pasos }) => (
            <TarjetaProyecto key={p.id} p={p} pasos={pasos} />
          ))}
        </Desplegable>
      )}

      {!soloMios && !fase && !!descartados.length && (
        <Desplegable titulo={`Descartados (${descartados.length})`}>
          <Lista>
            {descartados.map(({ p }) => {
              const d = descartes.get(p.id)!;
              return (
                <Fila
                  key={p.id}
                  href={`/elsa/videos/${p.id}`}
                  titulo={p.titulo ?? p.id}
                  detalle={`${textoMotivo(d.motivo)} · ${estadoPeticion(d).texto.toLowerCase()}`}
                />
              );
            })}
          </Lista>
        </Desplegable>
      )}
    </Pantalla>
  );
}

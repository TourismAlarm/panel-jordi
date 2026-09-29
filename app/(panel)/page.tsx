import { Aviso, BotonActualizar, BotonEnlace, Desplegable, Fila, Icono, Lista, Pantalla, Rotulo, Seccion, Segmentos, Vacio } from "@/components/ui";
import { BotonDeshacer } from "@/components/proyectos/BotonDeshacer";
import { TarjetaProyecto } from "@/components/proyectos/TarjetaProyecto";
import { descartesPorVideo, listarPeticiones } from "@/lib/datos/peticiones";
import { contarEnviadas, resumenPreguntas } from "@/lib/datos/preguntas";
import { listarProyectos, ultimaSincronizacion } from "@/lib/datos/videos";
import { faseVideo, textoMotivo } from "@/lib/estados";
import { agruparPor, dia, diaCercano, haceCuanto, hoyLargo, plural } from "@/lib/formato";
import { pasosDe, teToca } from "@/lib/pasos";

// Portada: todos los proyectos abiertos en orden de fecha, cada uno con sus pasos.
// «Me toca» deja solo los que tienen algo tuyo pendiente. Arriba, los guiones que has pedido;
// al final, plegados, los hechos y los que has descartado.
export default async function Proyectos({ searchParams }: PageProps<"/">) {
  const [{ ver }, proyectos, preguntas, enviadas, peticiones] = await Promise.all([
    searchParams,
    listarProyectos(),
    resumenPreguntas(),
    contarEnviadas(),
    listarPeticiones(),
  ]);

  const descartes = descartesPorVideo(peticiones);
  const pedidos = peticiones.filter((x) => x.tipo === "nuevo" && !x.recogida_en);
  const conPasos = proyectos.map((p) => ({ p, pasos: pasosDe(p, preguntas.get(p.id)) }));
  const vivos = conPasos.filter(({ p }) => !descartes.has(p.id));
  const descartados = conPasos.filter(({ p }) => descartes.has(p.id));
  const abiertos = vivos.filter(({ p }) => faseVideo(p.estado) !== "hecho");
  const mios = abiertos.filter(({ pasos }) => teToca(pasos));
  const hechos = vivos.filter(({ p }) => faseVideo(p.estado) === "hecho").reverse();
  const soloMios = ver === "mios";
  const lista = soloMios ? mios : abiertos;

  return (
    <Pantalla
      titulo="Proyectos"
      subtitulo={`${hoyLargo()} · datos del PC ${haceCuanto(ultimaSincronizacion(proyectos)) || "sin sincronizar"}`}
      accion={
        <>
          <BotonEnlace href="/nuevo" variante="secundario" compacto>
            <Icono nombre="anadir" tamano={18} />
            Guion
          </BotonEnlace>
          <BotonActualizar />
        </>
      }
    >
      <Segmentos
        opciones={[
          { href: "/", texto: `Todos (${abiertos.length})`, activo: !soloMios },
          { href: "/?ver=mios", texto: `Me toca (${mios.length})`, activo: soloMios },
        ]}
      />

      {!!enviadas && (
        <Aviso tono="info">
          {plural(enviadas, "respuesta enviada", "respuestas enviadas")}. El PC las recoge en menos de 15 min.
        </Aviso>
      )}

      {!!pedidos.length && (
        <Seccion titulo="Guiones que has pedido">
          <Lista>
            {pedidos.map((x) => (
              <Fila
                key={x.id}
                inicio={<Icono nombre="reloj" />}
                titulo={x.texto}
                detalle={`${x.fecha_trabajo ? `Para el ${dia(x.fecha_trabajo)} · ` : ""}esperando a que el PC lo recoja`}
                fin={<BotonDeshacer id={x.id} />}
              />
            ))}
          </Lista>
        </Seccion>
      )}

      {!lista.length &&
        (soloMios ? (
          <Vacio titulo="Nada que hacer ahora mismo" texto="El resto lo lleva el PC." />
        ) : (
          <Vacio icono="videos" tono="neutro" titulo="No hay proyectos abiertos" texto="Aparecerán cuando el PC los suba." />
        ))}

      {agruparPor(lista, ({ p }) => diaCercano(p.fecha_trabajo)).map((g) => (
        <section key={g.etiqueta} style={{ display: "contents" }}>
          <Rotulo acento={g.etiqueta === "Hoy" || g.etiqueta === "Mañana"}>{g.etiqueta}</Rotulo>
          {g.items.map(({ p, pasos }) => (
            <TarjetaProyecto key={p.id} p={p} pasos={pasos} conFecha={false} />
          ))}
        </section>
      ))}

      {!soloMios && !!hechos.length && (
        <Desplegable titulo={`Hechos (${hechos.length})`}>
          {hechos.map(({ p, pasos }) => (
            <TarjetaProyecto key={p.id} p={p} pasos={pasos} />
          ))}
        </Desplegable>
      )}

      {!soloMios && !!descartados.length && (
        <Desplegable titulo={`Descartados (${descartados.length})`}>
          <Lista>
            {descartados.map(({ p }) => {
              const d = descartes.get(p.id)!;
              return (
                <Fila
                  key={p.id}
                  href={`/videos/${p.id}`}
                  titulo={p.titulo ?? p.id}
                  detalle={`${textoMotivo(d.motivo)} · ${d.recogida_en ? "el PC ya lo sabe" : "esperando al PC"}`}
                />
              );
            })}
          </Lista>
        </Desplegable>
      )}
    </Pantalla>
  );
}

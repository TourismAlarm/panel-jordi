import { Aviso, Desplegable, Pantalla, Rotulo, Segmentos, Vacio } from "@/components/ui";
import { TarjetaProyecto } from "@/components/proyectos/TarjetaProyecto";
import { contarEnviadas, resumenPreguntas } from "@/lib/datos/preguntas";
import { listarProyectos, ultimaSincronizacion } from "@/lib/datos/videos";
import { faseVideo } from "@/lib/estados";
import { agruparPor, diaCercano, haceCuanto, hoyLargo, plural } from "@/lib/formato";
import { pasosDe, teToca } from "@/lib/pasos";

// Portada: todos los proyectos abiertos en orden de fecha, cada uno con sus pasos.
// «Me toca» deja solo los que tienen algo tuyo pendiente. Los hechos, plegados al final.
export default async function Proyectos({ searchParams }: PageProps<"/">) {
  const [{ ver }, proyectos, preguntas, enviadas] = await Promise.all([
    searchParams,
    listarProyectos(),
    resumenPreguntas(),
    contarEnviadas(),
  ]);

  const conPasos = proyectos.map((p) => ({ p, pasos: pasosDe(p, preguntas.get(p.id)) }));
  const abiertos = conPasos.filter(({ p }) => faseVideo(p.estado) !== "hecho");
  const mios = abiertos.filter(({ pasos }) => teToca(pasos));
  const hechos = conPasos.filter(({ p }) => faseVideo(p.estado) === "hecho").reverse();
  const soloMios = ver === "mios";
  const lista = soloMios ? mios : abiertos;

  return (
    <Pantalla titulo="Proyectos" subtitulo={`${hoyLargo()} · datos del PC ${haceCuanto(ultimaSincronizacion(proyectos)) || "sin sincronizar"}`}>
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
    </Pantalla>
  );
}

import { Aviso, Desplegable, Etiqueta, Fila, Lista, Pantalla, Punto, Seccion, Vacio } from "@/components/ui";
import { TarjetaProyecto } from "@/components/proyectos/TarjetaProyecto";
import { contarEnviadas, preguntasPendientes } from "@/lib/datos/preguntas";
import { listarProyectos, ultimaSincronizacion, type Proyecto } from "@/lib/datos/videos";
import { faseVideo } from "@/lib/estados";
import { haceCuanto, hoy, hoyLargo, plural } from "@/lib/formato";

// Portada = tus proyectos, ordenados por lo que toca hacer con cada uno.
// Arriba, solo si hay algo, lo que espera una respuesta tuya.
export default async function Proyectos() {
  const [proyectos, pendientes, enviadas] = await Promise.all([listarProyectos(), preguntasPendientes(), contarEnviadas()]);

  const preguntasDe = new Map<string, number>();
  for (const q of pendientes) preguntasDe.set(q.video_id, (preguntasDe.get(q.video_id) ?? 0) + 1);

  const h = hoy();
  const de = (fase: ReturnType<typeof faseVideo>) => proyectos.filter((p) => faseVideo(p.estado) === fase);
  const grabar = de("grabar");
  const proximos = grabar.filter((p) => !p.fecha_trabajo || p.fecha_trabajo >= h);
  const sinMaterial = grabar.filter((p) => p.fecha_trabajo && p.fecha_trabajo < h).reverse();
  const guion = de("guion");
  const montaje = de("montaje");
  const hechos = de("hecho").reverse();

  const titulo = (id: string) => proyectos.find((p) => p.id === id)?.titulo ?? id;
  const revisar = proyectos.filter((p) => p.por_revisar);
  const teToca = revisar.length + preguntasDe.size;

  const tarjetas = (lista: Proyecto[]) =>
    lista.map((p) => <TarjetaProyecto key={p.id} p={p} preguntas={preguntasDe.get(p.id)} />);

  return (
    <Pantalla titulo="Proyectos" subtitulo={`${hoyLargo()} · datos del PC ${haceCuanto(ultimaSincronizacion(proyectos)) || "sin sincronizar"}`}>
      {!!enviadas && (
        <Aviso tono="info">
          {plural(enviadas, "respuesta enviada", "respuestas enviadas")}. El PC las recoge en menos de 15 min.
        </Aviso>
      )}

      {!!teToca && (
        <Seccion titulo="Te toca" cuenta={teToca}>
          <Lista>
            {revisar.map((p) => (
              <Fila
                key={`r-${p.id}`}
                href={`/videos/${p.id}`}
                inicio={<Punto tono="ojo" />}
                titulo={p.titulo ?? p.id}
                detalle={<Etiqueta tono="ojo">Revisar montaje (correo «montaje listo»)</Etiqueta>}
              />
            ))}
            {[...preguntasDe].map(([id, n]) => (
              <Fila
                key={`p-${id}`}
                href={`/videos/${id}#preguntas`}
                inicio={<Punto tono="ojo" />}
                titulo={titulo(id)}
                detalle={<Etiqueta tono="ojo">Contestar {plural(n, "pregunta")}</Etiqueta>}
              />
            ))}
          </Lista>
        </Seccion>
      )}

      {!proyectos.length && <Vacio icono="videos" tono="neutro" titulo="Aún no hay proyectos" texto="Aparecerán cuando el PC los suba." />}

      {!!proximos.length && <Seccion titulo="Próximos trabajos">{tarjetas(proximos)}</Seccion>}

      {!!sinMaterial.length && (
        <Seccion titulo="Ya pasó el día · falta el material">
          <p className="suave pequeno">Si ya lo grabaste, suelta los vídeos en videos/_entrada/ y el PC los reparte solo.</p>
          {tarjetas(sinMaterial)}
        </Seccion>
      )}

      {!!guion.length && <Seccion titulo="Preparando guion">{tarjetas(guion)}</Seccion>}

      {!!montaje.length && <Seccion titulo="En montaje">{tarjetas(montaje)}</Seccion>}

      {!!hechos.length && (
        <Seccion titulo="Hechos">
          <Desplegable titulo={`${plural(hechos.length, "proyecto hecho", "proyectos hechos")}`}>{tarjetas(hechos)}</Desplegable>
        </Seccion>
      )}
    </Pantalla>
  );
}

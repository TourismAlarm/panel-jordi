import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BotonEnlace, Desplegable, Etiqueta, Fila, Icono, Lista, Pantalla, Seccion, Tarjeta } from "@/components/ui";
import { Registro } from "@/components/actividad/Registro";
import { FormPregunta } from "@/components/preguntas/FormPregunta";
import { Guion } from "@/components/videos/Guion";
import { actividadDeVideo } from "@/lib/datos/actividad";
import { preguntasDeVideo } from "@/lib/datos/preguntas";
import { obtenerVideo } from "@/lib/datos/videos";
import { estadoVideo, faseVideo, fasePregunta } from "@/lib/estados";
import { buscarSeccion, esSeccionPropia, fichaDeGuion, SECCION, seccionesDeGuion } from "@/lib/guion";
import { diaCercano, haceCuanto, plural } from "@/lib/formato";

export async function generateMetadata({ params }: PageProps<"/videos/[id]">): Promise<Metadata> {
  const { id } = await params;
  const video = await obtenerVideo(id);
  return { title: video?.titulo ?? id };
}

// Ficha de un proyecto: lo esencial arriba (guion, cuándo, dónde, qué falta) y el resto plegado.
export default async function Proyecto({ params }: PageProps<"/videos/[id]">) {
  const { id } = await params;
  const [video, preguntas, actividad] = await Promise.all([obtenerVideo(id), preguntasDeVideo(id), actividadDeVideo(id)]);
  if (!video) notFound();

  const e = estadoVideo(video.estado);
  const fase = faseVideo(video.estado);
  const ficha = fichaDeGuion(video.guion_md);
  const secciones = seccionesDeGuion(video.guion_md);
  const notas = buscarSeccion(secciones, SECCION.notas);
  const otras = secciones.filter((s) => !esSeccionPropia(s));
  const pendientes = preguntas.filter((p) => fasePregunta(p) === "pendiente").length;

  return (
    <Pantalla
      volver={{ href: "/", texto: "Proyectos" }}
      antetitulo={video.id}
      titulo={video.titulo ?? video.id}
      subtitulo={`Actualizado ${haceCuanto(video.actualizado_en)}${ficha.version ? ` · guion ${ficha.version}` : ""}`}
    >
      <Etiqueta tono={e.tono}>{e.texto}</Etiqueta>

      {video.guion_md ? (
        <BotonEnlace href={`/videos/${video.id}/guion`}>
          <Icono nombre="guion" />
          Leer el guion
        </BotonEnlace>
      ) : (
        <Tarjeta>
          <span className="suave">Todavía no hay guion. El guionista lo subirá cuando esté.</span>
        </Tarjeta>
      )}

      <Lista>
        <Fila
          inicio={<Icono nombre="calendario" />}
          titulo={`${diaCercano(video.fecha_trabajo)}${ficha.hora ? ` · ${ficha.hora}` : ""}`}
          detalle={ficha.franja}
        />
        <Fila inicio={<Icono nombre="lugar" />} titulo={ficha.lugar ?? <span className="suave">Lugar por confirmar</span>} />
        {ficha.camion && <Fila inicio={<Icono nombre="camion" />} titulo={`Camión ${ficha.camion}`} />}
        {ficha.trabajo && <Fila inicio={<Icono nombre="info" />} titulo="El trabajo" detalle={ficha.trabajo} />}
      </Lista>

      {video.siguiente_paso && (
        <Tarjeta destacada={video.por_revisar} tono={video.por_revisar ? undefined : "info"}>
          <span className="codigo">SIGUIENTE PASO</span>
          <span>{video.siguiente_paso}</span>
        </Tarjeta>
      )}

      {!!preguntas.length && (
        <Seccion titulo="Preguntas" id="preguntas" cuenta={pendientes}>
          {preguntas.map((p) => (
            <FormPregunta key={p.id} videoId={video.id} p={p} />
          ))}
        </Seccion>
      )}

      {(notas || ficha.porConfirmar.length > 0 || otras.length > 0) && (
        <Seccion titulo="Del guion">
          {notas && (
            <Desplegable abierto={fase === "grabar"} titulo="Notas para grabar">
              <Guion md={notas.md} />
            </Desplegable>
          )}
          {!!ficha.porConfirmar.length && (
            <Desplegable titulo={`Datos por confirmar (${ficha.porConfirmar.length})`}>
              <ul style={{ margin: 0, paddingLeft: "1.2em" }}>
                {ficha.porConfirmar.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </Desplegable>
          )}
          {otras.map((s) => (
            <Desplegable key={s.clave} titulo={s.titulo}>
              <Guion md={s.md} />
            </Desplegable>
          ))}
        </Seccion>
      )}

      <Seccion titulo="Actividad">
        <Desplegable titulo={actividad.length ? plural(actividad.length, "registro") : "Sin actividad"}>
          <Registro filas={actividad} />
        </Desplegable>
      </Seccion>
    </Pantalla>
  );
}

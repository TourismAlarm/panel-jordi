import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BotonEnlace, Desplegable, Fila, Icono, Lista, Pantalla, Seccion, Tarjeta } from "@/components/ui";
import { Registro } from "@/components/actividad/Registro";
import { FormPregunta } from "@/components/preguntas/FormPregunta";
import { AvisoDescartado } from "@/components/proyectos/AvisoDescartado";
import { FormDescartar } from "@/components/proyectos/FormDescartar";
import { MaterialListo } from "@/components/proyectos/MaterialListo";
import { RevisarMontaje } from "@/components/proyectos/RevisarMontaje";
import { ListaPasos } from "@/components/proyectos/ListaPasos";
import { Guion } from "@/components/videos/Guion";
import { actividadDeVideo } from "@/lib/datos/actividad";
import { descartesFallidos, descartesPorVideo, listarPeticiones, materialDeVideo, revisionDeVideo } from "@/lib/datos/peticiones";
import { preguntasDeVideo, resumir } from "@/lib/datos/preguntas";
import { obtenerVideo } from "@/lib/datos/videos";
import { faseVideo, estadoPeticion } from "@/lib/estados";
import { PETICIONES_ACTIVAS } from "@/lib/funciones";
import { buscarSeccion, esSeccionPropia, fichaDeGuion, SECCION, seccionesDeGuion } from "@/lib/guion";
import { diaCercano, haceCuanto, plural } from "@/lib/formato";
import { pasosDe } from "@/lib/pasos";

export async function generateMetadata({ params }: PageProps<"/videos/[id]">): Promise<Metadata> {
  const { id } = await params;
  const video = await obtenerVideo(id);
  return { title: video?.titulo ?? id };
}

// Ficha de un proyecto: guion, cuándo y dónde, los pasos en orden (con botón en los tuyos),
// las preguntas y, plegado, el resto del guion y la actividad.
export default async function Proyecto({ params }: PageProps<"/videos/[id]">) {
  const { id } = await params;
  const [video, preguntas, actividad, peticiones] = await Promise.all([
    obtenerVideo(id),
    preguntasDeVideo(id),
    actividadDeVideo(id),
    PETICIONES_ACTIVAS ? listarPeticiones() : Promise.resolve([]),
  ]);
  if (!video) notFound();

  const fase = faseVideo(video.estado);
  const descarte = descartesPorVideo(peticiones).get(video.id);
  const revision = revisionDeVideo(peticiones, video.id);
  const material = materialDeVideo(peticiones, video.id);
  const descarteFallido = descartesFallidos(peticiones).get(video.id);
  const ficha = fichaDeGuion(video.guion_md);
  const resumen = resumir(preguntas);
  const pasos = pasosDe({ ...video, ficha, tieneGuion: !!video.guion_md, descartado: !!descarte, materialListo: !!material }, resumen);
  const secciones = seccionesDeGuion(video.guion_md);
  const notas = buscarSeccion(secciones, SECCION.notas);
  const otras = secciones.filter((s) => !esSeccionPropia(s));

  return (
    <Pantalla
      volver={{ href: "/", texto: "Proyectos" }}
      antetitulo={video.id}
      titulo={video.titulo ?? video.id}
      subtitulo={`Actualizado ${haceCuanto(video.actualizado_en)}${ficha.version ? ` · guion ${ficha.version}` : ""}`}
    >
      {descarte && <AvisoDescartado p={descarte} />}
      {descarteFallido && (
        <Tarjeta tono="mal">
          <strong>No se pudo descartar</strong>
          <span className="suave pequeno">{estadoPeticion(descarteFallido).texto}</span>
        </Tarjeta>
      )}

      {video.guion_md ? (
        <BotonEnlace href={`/videos/${video.id}/guion`}>
          <Icono nombre="guion" />
          Leer el guion
        </BotonEnlace>
      ) : (
        <Tarjeta>
          <span className="suave">
            {video.sin_guion ? "Sin guion: se monta con lo que grabaste." : "Todavía no hay guion. El guionista lo subirá cuando esté."}
          </span>
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

      {!descarte && (
        <Seccion titulo="Pasos">
          <ListaPasos pasos={pasos} />
          {video.siguiente_paso && (
            <p className="suave pequeno">
              <strong>Nota del PC:</strong> {video.siguiente_paso}
            </p>
          )}
        </Seccion>
      )}

      {!descarte && (fase === "guion" || fase === "grabar") && (
        <Seccion titulo="Material grabado" id="material">
          <MaterialListo videoId={video.id} peticion={material} />
        </Seccion>
      )}

      {!descarte && (video.por_revisar || video.estado === "revision_jordi" || revision?.estado === "procesando" || revision?.estado === "pendiente") && (
        <Seccion titulo="Revisar el montaje" id="montaje">
          <RevisarMontaje videoId={video.id} montajeUrl={video.montaje_url} revision={revision} />
        </Seccion>
      )}

      {PETICIONES_ACTIVAS && !descarte && fase !== "hecho" && (
        <Seccion titulo="¿Este no?">
          <p className="suave pequeno">Si no lo hiciste tú, no te gusta el planteamiento o ya no sirve, descártalo y el PC deja de trabajar en él.</p>
          <FormDescartar videoId={video.id} />
        </Seccion>
      )}

      {!descarte && !!preguntas.length && (
        <Seccion titulo="Preguntas" id="preguntas" cuenta={resumen.sinContestar}>
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

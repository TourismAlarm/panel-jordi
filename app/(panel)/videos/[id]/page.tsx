import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Desplegable, Etiqueta, Icono, Pantalla, Seccion, Tarjeta } from "@/components/ui";
import { Registro } from "@/components/actividad/Registro";
import { FormPregunta } from "@/components/preguntas/FormPregunta";
import { Guion } from "@/components/videos/Guion";
import { actividadDeVideo } from "@/lib/datos/actividad";
import { preguntasDeVideo } from "@/lib/datos/preguntas";
import { obtenerVideo } from "@/lib/datos/videos";
import { estadoVideo, fasePregunta } from "@/lib/estados";
import { dia, haceCuanto } from "@/lib/formato";

export async function generateMetadata({ params }: PageProps<"/videos/[id]">): Promise<Metadata> {
  const { id } = await params;
  const video = await obtenerVideo(id);
  return { title: video?.titulo ?? id };
}

export default async function Video({ params }: PageProps<"/videos/[id]">) {
  const { id } = await params;
  const [video, preguntas, actividad] = await Promise.all([obtenerVideo(id), preguntasDeVideo(id), actividadDeVideo(id)]);
  if (!video) notFound();

  const e = estadoVideo(video.estado);
  const pendientes = preguntas.filter((p) => fasePregunta(p) === "pendiente").length;
  const subtitulo = [video.fecha_trabajo && `Trabajo: ${dia(video.fecha_trabajo)}`, `actualizado ${haceCuanto(video.actualizado_en)}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <Pantalla volver={{ href: "/videos", texto: "Vídeos" }} antetitulo={video.id} titulo={video.titulo ?? video.id} subtitulo={subtitulo}>
      <Etiqueta tono={e.tono}>{e.texto}</Etiqueta>

      {video.siguiente_paso && (
        <Tarjeta destacada={video.por_revisar}>
          <span className="codigo">SIGUIENTE PASO</span>
          <span>{video.siguiente_paso}</span>
        </Tarjeta>
      )}

      {!!preguntas.length && (
        <Seccion titulo="Preguntas" cuenta={pendientes}>
          {preguntas.map((p) => (
            <FormPregunta key={p.id} videoId={video.id} p={p} />
          ))}
        </Seccion>
      )}

      <Seccion titulo="Guion">
        <Desplegable
          abierto={!pendientes}
          titulo={
            <>
              <Icono nombre="guion" tamano={20} />
              {video.guion_md ? "Leer el guion" : "Todavía no hay guion"}
            </>
          }
        >
          {video.guion_md ? <Guion md={video.guion_md} /> : <p className="suave">El guionista lo subirá cuando esté.</p>}
        </Desplegable>
      </Seccion>

      <Seccion titulo="Actividad">
        <Registro filas={actividad} />
      </Seccion>
    </Pantalla>
  );
}

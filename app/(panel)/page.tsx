import { Aviso, Cifra, Cifras, Lista, Pantalla, Seccion, Tarjeta, Etiqueta, Vacio } from "@/components/ui";
import { ListaAgentes } from "@/components/actividad/ListaAgentes";
import { TarjetaPendientes } from "@/components/preguntas/TarjetaPendientes";
import { FilaVideo } from "@/components/videos/FilaVideo";
import { estadoAgentes } from "@/lib/datos/actividad";
import { contarEnviadas, preguntasPendientes } from "@/lib/datos/preguntas";
import { listarVideos, ultimaSincronizacion } from "@/lib/datos/videos";
import { videoCerrado } from "@/lib/estados";
import { haceCuanto, plural } from "@/lib/formato";

// Portada: cifras de un vistazo, lo que te toca, próximos trabajos y cómo van los agentes.
export default async function Inicio() {
  const [videos, pendientes, enviadas, { agentes, fallos7d }] = await Promise.all([
    listarVideos(),
    preguntasPendientes(),
    contarEnviadas(),
    estadoAgentes(),
  ]);

  const titulo = new Map(videos.map((v) => [v.id, v.titulo ?? v.id]));
  const revisar = videos.filter((v) => v.por_revisar);
  const enMarcha = videos.filter((v) => !videoCerrado(v.estado));

  const porVideo = new Map<string, string[]>();
  for (const p of pendientes) porVideo.set(p.video_id, [...(porVideo.get(p.video_id) ?? []), p.texto]);

  const teToca = revisar.length + porVideo.size;

  return (
    <Pantalla titulo="Panel ELSA" subtitulo={`Datos del PC ${haceCuanto(ultimaSincronizacion(videos)) || "sin sincronizar"}`}>
      <Cifras>
        <Cifra valor={pendientes.length} texto="Preguntas" tono={pendientes.length ? "ojo" : "bien"} href="#te-toca" />
        <Cifra valor={revisar.length} texto="Por revisar" tono={revisar.length ? "ojo" : "bien"} href="#te-toca" />
        <Cifra valor={enMarcha.length} texto="En marcha" tono="info" href="/videos" />
        <Cifra valor={fallos7d} texto="Fallos 7 días" tono={fallos7d ? "mal" : "bien"} href="/actividad" />
      </Cifras>

      {!!enviadas && (
        <Aviso tono="info">
          {plural(enviadas, "respuesta enviada", "respuestas enviadas")}. El PC las recoge en menos de 15 min.
        </Aviso>
      )}

      <Seccion titulo="Te toca" id="te-toca" cuenta={teToca}>
        {!teToca && <Vacio titulo="Nada pendiente" texto="El sistema sigue solo." />}
        {revisar.map((v) => (
          <Tarjeta key={v.id} href={`/videos/${v.id}`} destacada>
            <span className="codigo">{v.id}</span>
            <strong>{v.titulo}</strong>
            <Etiqueta tono="ojo">Revisar montaje</Etiqueta>
            <span className="suave pequeno">Mira el correo «montaje listo» y contesta en el hilo.</span>
          </Tarjeta>
        ))}
        {[...porVideo].map(([videoId, textos]) => (
          <TarjetaPendientes key={videoId} videoId={videoId} titulo={titulo.get(videoId) ?? videoId} textos={textos} />
        ))}
      </Seccion>

      <Seccion titulo="Trabajos" extra={{ texto: "Todos", href: "/videos" }}>
        {enMarcha.length ? (
          <Lista>
            {enMarcha.map((v) => (
              <FilaVideo key={v.id} v={v} />
            ))}
          </Lista>
        ) : (
          <Vacio icono="videos" tono="neutro" titulo="Ningún vídeo en marcha" />
        )}
      </Seccion>

      <Seccion titulo="Agentes" extra={{ texto: "Actividad", href: "/actividad" }}>
        <ListaAgentes agentes={agentes} />
      </Seccion>
    </Pantalla>
  );
}

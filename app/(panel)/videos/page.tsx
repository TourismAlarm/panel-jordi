import type { Metadata } from "next";
import { Desplegable, Pantalla, Vacio } from "@/components/ui";
import { TarjetaVideo } from "@/components/videos/TarjetaVideo";
import { listarVideos, ultimaSincronizacion } from "@/lib/datos/videos";
import { videoCerrado } from "@/lib/estados";
import { haceCuanto } from "@/lib/formato";

export const metadata: Metadata = { title: "Vídeos" };

export default async function Videos() {
  const videos = await listarVideos();
  const activos = videos.filter((v) => !videoCerrado(v.estado));
  const cerrados = videos.filter((v) => videoCerrado(v.estado)).reverse();

  return (
    <Pantalla titulo="Vídeos" subtitulo={`${activos.length} en marcha · datos del PC ${haceCuanto(ultimaSincronizacion(videos))}`}>
      {!videos.length && <Vacio icono="videos" tono="neutro" titulo="Aún no hay vídeos" texto="Aparecerán cuando el PC los suba." />}
      {activos.map((v) => (
        <TarjetaVideo key={v.id} v={v} />
      ))}
      {!!cerrados.length && (
        <Desplegable titulo={`Cerrados (${cerrados.length})`}>
          {cerrados.map((v) => (
            <TarjetaVideo key={v.id} v={v} />
          ))}
        </Desplegable>
      )}
    </Pantalla>
  );
}

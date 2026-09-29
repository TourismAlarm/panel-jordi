import { Etiqueta, Fila } from "@/components/ui";
import type { VideoResumen } from "@/lib/datos/videos";
import { estadoVideo } from "@/lib/estados";
import { dia } from "@/lib/formato";

// Un vídeo en versión compacta (portada): fecha a la izquierda, título y estado.
export function FilaVideo({ v }: { v: Pick<VideoResumen, "id" | "titulo" | "estado" | "fecha_trabajo"> }) {
  const e = estadoVideo(v.estado);
  return (
    <Fila
      href={`/videos/${v.id}`}
      inicio={<span style={{ width: "4.2em" }}>{dia(v.fecha_trabajo) || "—"}</span>}
      titulo={v.titulo ?? v.id}
      detalle={<Etiqueta tono={e.tono}>{e.texto}</Etiqueta>}
    />
  );
}

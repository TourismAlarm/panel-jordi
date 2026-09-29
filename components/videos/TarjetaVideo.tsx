import { Etiqueta, Tarjeta } from "@/components/ui";
import type { VideoResumen } from "@/lib/datos/videos";
import { estadoVideo } from "@/lib/estados";
import { dia } from "@/lib/formato";

// Un vídeo en la lista de Vídeos: código, fecha, estado, título y siguiente paso.
export function TarjetaVideo({ v }: { v: Pick<VideoResumen, "id" | "titulo" | "estado" | "fecha_trabajo" | "siguiente_paso" | "por_revisar"> }) {
  const e = estadoVideo(v.estado);
  return (
    <Tarjeta href={`/videos/${v.id}`} destacada={v.por_revisar}>
      <span className="codigo">
        {v.id}
        {v.fecha_trabajo && <span style={{ fontWeight: 600 }}> · {dia(v.fecha_trabajo)}</span>}
      </span>
      <strong>{v.titulo ?? "Sin título"}</strong>
      <Etiqueta tono={e.tono}>{e.texto}</Etiqueta>
      {v.siguiente_paso && <span className="suave pequeno recorte">{v.siguiente_paso}</span>}
    </Tarjeta>
  );
}

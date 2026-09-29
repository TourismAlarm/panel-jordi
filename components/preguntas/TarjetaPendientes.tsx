import { Etiqueta, Tarjeta } from "@/components/ui";
import { plural } from "@/lib/formato";

// En la portada: «E012 · 3 preguntas» con la primera pregunta de muestra.
export function TarjetaPendientes({ videoId, titulo, textos }: { videoId: string; titulo: string; textos: string[] }) {
  return (
    <Tarjeta href={`/videos/${videoId}`} tono="ojo">
      <span className="codigo">{videoId}</span>
      <strong>{titulo}</strong>
      <Etiqueta tono="ojo">{plural(textos.length, "pregunta")} para ti</Etiqueta>
      <span className="suave pequeno recorte">«{textos[0]}»</span>
    </Tarjeta>
  );
}

import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabaseServidor } from "@/lib/supabase/server";
import { dia, estadoCorto, haceCuanto } from "@/lib/formato";
import Registro from "@/app/registro";
import Pregunta from "./pregunta";

// El guion lleva un bloque YAML arriba (datos internos); en el móvil se enseña solo el texto.
function sinFrontmatter(md: string) {
  return md.replace(/^---\n[\s\S]*?\n---\n/, "");
}

export default async function Video({ params }: PageProps<"/videos/[id]">) {
  const { id } = await params;
  const supabase = await supabaseServidor();
  const [{ data: video }, { data: preguntas }, { data: actividad }] = await Promise.all([
    supabase.from("videos").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("preguntas")
      .select("id, clave, orden, texto, respuesta, respondida_en, recogida_en")
      .eq("video_id", id)
      .order("orden"),
    supabase
      .from("ejecuciones_agentes")
      .select("id, agente, video_id, fin, resultado, resumen")
      .eq("video_id", id)
      .order("fin", { ascending: false })
      .limit(15),
  ]);
  if (!video) notFound();

  return (
    <main>
      <p className="codigo">{video.id}</p>
      <h1>{video.titulo}</h1>
      <p className="fila">
        <span className={`chip ${estadoCorto(video.estado).tono}`}>
          <i />
          {estadoCorto(video.estado).texto}
        </span>
        {video.fecha_trabajo && <span className="apagado pequeno">Trabajo: {dia(video.fecha_trabajo)}</span>}
        <span className="apagado pequeno">· actualizado {haceCuanto(video.actualizado_en)}</span>
      </p>
      {video.siguiente_paso && (
        <div className={`tarjeta siguiente ${video.por_revisar ? "destacado" : ""}`}>
          <span className="codigo">Siguiente paso</span>
          <span>{video.siguiente_paso}</span>
        </div>
      )}

      {!!preguntas?.length && (
        <section>
          <h2>Preguntas</h2>
          {preguntas.map((p) => (
            <Pregunta key={p.id} videoId={video.id} p={p} />
          ))}
        </section>
      )}

      <section className="guion">
        <details open={!preguntas?.length}>
          <summary>
            <h2>Guion</h2>
          </summary>
          {video.guion_md ? (
            <Markdown remarkPlugins={[remarkGfm]}>{sinFrontmatter(video.guion_md)}</Markdown>
          ) : (
            <p className="apagado">Todavía no hay guion.</p>
          )}
        </details>
      </section>

      <section>
        <h2>Actividad</h2>
        <Registro filas={actividad ?? []} />
      </section>
    </main>
  );
}

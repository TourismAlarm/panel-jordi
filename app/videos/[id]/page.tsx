import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabaseServidor } from "@/lib/supabase/server";
import Pregunta from "./pregunta";

// El guion lleva un bloque YAML arriba (datos internos); en el móvil se enseña solo el texto.
function sinFrontmatter(md: string) {
  return md.replace(/^---\n[\s\S]*?\n---\n/, "");
}

export default async function Video({ params }: PageProps<"/videos/[id]">) {
  const { id } = await params;
  const supabase = await supabaseServidor();
  const [{ data: video }, { data: preguntas }] = await Promise.all([
    supabase.from("videos").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("preguntas")
      .select("id, clave, orden, texto, respuesta, respondida_en, recogida_en")
      .eq("video_id", id)
      .order("orden"),
  ]);
  if (!video) notFound();

  return (
    <main>
      <Link href="/" className="volver">← Vídeos</Link>
      <p className="codigo">{video.id}</p>
      <h1>{video.titulo}</h1>
      <p>
        <span className="badge">{video.estado.replaceAll("_", " ")}</span>
      </p>
      {video.siguiente_paso && <p className="apagado">{video.siguiente_paso}</p>}

      {!!preguntas?.length && (
        <section>
          <h2>Preguntas</h2>
          {preguntas.map((p) => (
            <Pregunta key={p.id} videoId={video.id} p={p} />
          ))}
        </section>
      )}

      <section className="guion">
        <h2>Guion</h2>
        {video.guion_md ? (
          <Markdown remarkPlugins={[remarkGfm]}>{sinFrontmatter(video.guion_md)}</Markdown>
        ) : (
          <p className="apagado">Todavía no hay guion.</p>
        )}
      </section>
    </main>
  );
}

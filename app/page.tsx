import Link from "next/link";
import { supabaseServidor } from "@/lib/supabase/server";
import { haceCuanto } from "@/lib/formato";

// «Te toca»: lo único que necesita a Jordi. Preguntas sin contestar y montajes por revisar.
export default async function TeToca() {
  const supabase = await supabaseServidor();
  const [{ data: preguntas }, { data: revisar }, { data: ultimo }, { count: enviadas }] = await Promise.all([
    supabase
      .from("preguntas")
      .select("id, clave, texto, video_id, videos(titulo)")
      .is("respondida_en", null)
      .order("video_id")
      .order("orden"),
    supabase.from("videos").select("id, titulo, siguiente_paso").eq("por_revisar", true).order("id"),
    supabase.from("videos").select("actualizado_en").order("actualizado_en", { ascending: false }).limit(1),
    supabase
      .from("preguntas")
      .select("id", { count: "exact", head: true })
      .not("respondida_en", "is", null)
      .is("recogida_en", null),
  ]);

  const grupos = new Map<string, { titulo: string; items: { id: string; clave: string; texto: string }[] }>();
  for (const p of preguntas ?? []) {
    const v = p.videos as unknown as { titulo: string } | null;
    if (!grupos.has(p.video_id)) grupos.set(p.video_id, { titulo: v?.titulo ?? p.video_id, items: [] });
    grupos.get(p.video_id)!.items.push(p);
  }
  const nada = !grupos.size && !revisar?.length;

  return (
    <main>
      <h1>Te toca</h1>
      <p className="apagado pequeno">Datos del PC {haceCuanto(ultimo?.[0]?.actualizado_en ?? null)}</p>
      {!!enviadas && (
        <p className="aviso">
          {enviadas} respuesta{enviadas > 1 ? "s" : ""} enviada{enviadas > 1 ? "s" : ""}, esperando a que el PC la
          {enviadas > 1 ? "s" : ""} recoja (cada 15 min).
        </p>
      )}

      {nada && (
        <div className="tarjeta vacio">
          <strong>Nada pendiente</strong>
          <span className="apagado">El sistema sigue solo. Mira «Vídeos» para ver cómo va cada uno.</span>
        </div>
      )}

      {!!revisar?.length && (
        <section>
          <h2>Montajes por revisar</h2>
          {revisar.map((v) => (
            <Link key={v.id} href={`/videos/${v.id}`} className="tarjeta enlace destacado">
              <span className="codigo">{v.id}</span>
              <strong>{v.titulo}</strong>
              <span className="apagado">Mira el correo «montaje listo» y contesta en el hilo.</span>
            </Link>
          ))}
        </section>
      )}

      {!!grupos.size && (
        <section>
          <h2>Preguntas sin contestar</h2>
          {[...grupos].map(([vid, g]) => (
            <Link key={vid} href={`/videos/${vid}`} className="tarjeta enlace">
              <span className="codigo">
                {vid} · {g.items.length} pregunta{g.items.length > 1 ? "s" : ""}
              </span>
              <strong>{g.titulo}</strong>
              <ul className="lista-preguntas">
                {g.items.map((p) => (
                  <li key={p.id}>{p.texto}</li>
                ))}
              </ul>
              <span className="cta">Contestar →</span>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}

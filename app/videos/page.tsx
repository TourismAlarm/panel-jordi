import Link from "next/link";
import { supabaseServidor } from "@/lib/supabase/server";
import { CERRADOS, estadoClase, estadoTexto, haceCuanto } from "@/lib/formato";

type V = { id: string; titulo: string | null; estado: string; siguiente_paso: string | null; actualizado_en: string };

function Tarjeta({ v }: { v: V }) {
  return (
    <Link href={`/videos/${v.id}`} className="tarjeta enlace">
      <span className="fila">
        <span className="codigo">{v.id}</span>
        <span className={`badge ${estadoClase(v.estado)}`}>{estadoTexto(v.estado)}</span>
      </span>
      <strong>{v.titulo}</strong>
      {v.siguiente_paso && <span className="apagado">{v.siguiente_paso}</span>}
    </Link>
  );
}

export default async function Videos() {
  const supabase = await supabaseServidor();
  const { data } = await supabase
    .from("videos")
    .select("id, titulo, estado, siguiente_paso, actualizado_en")
    .order("id", { ascending: false });
  const videos = (data ?? []) as V[];
  const activos = videos.filter((v) => !CERRADOS.test(v.estado));
  const cerrados = videos.filter((v) => CERRADOS.test(v.estado));

  return (
    <main>
      <h1>Vídeos</h1>
      <p className="apagado pequeno">
        {activos.length} en marcha · datos del PC {haceCuanto(videos[0]?.actualizado_en ?? null)}
      </p>
      {activos.map((v) => (
        <Tarjeta key={v.id} v={v} />
      ))}
      {!!cerrados.length && (
        <details className="cerrados">
          <summary>Cerrados ({cerrados.length})</summary>
          {cerrados.map((v) => (
            <Tarjeta key={v.id} v={v} />
          ))}
        </details>
      )}
    </main>
  );
}

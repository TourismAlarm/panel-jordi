import Link from "next/link";
import { supabaseServidor } from "@/lib/supabase/server";
import { CERRADOS, dia, estadoCorto, haceCuanto } from "@/lib/formato";

type V = {
  id: string;
  titulo: string | null;
  estado: string;
  siguiente_paso: string | null;
  fecha_trabajo: string | null;
  actualizado_en: string;
};

function Tarjeta({ v }: { v: V }) {
  const e = estadoCorto(v.estado);
  return (
    <Link href={`/videos/${v.id}`} className="tarjeta enlace">
      <span className="fila">
        <span className="codigo">{v.id}</span>
        {v.fecha_trabajo && <span className="apagado pequeno">{dia(v.fecha_trabajo)}</span>}
        <span className={`chip ${e.tono} derecha`}>
          <i />
          {e.texto}
        </span>
      </span>
      <strong>{v.titulo}</strong>
      {v.siguiente_paso && <span className="apagado pequeno recorte">{v.siguiente_paso}</span>}
    </Link>
  );
}

export default async function Videos() {
  const supabase = await supabaseServidor();
  const { data } = await supabase
    .from("videos")
    .select("id, titulo, estado, siguiente_paso, fecha_trabajo, actualizado_en")
    .order("fecha_trabajo", { ascending: true, nullsFirst: false });
  const videos = (data ?? []) as V[];
  const activos = videos.filter((v) => !CERRADOS.test(v.estado));
  const cerrados = videos.filter((v) => CERRADOS.test(v.estado)).reverse();
  const ultimo = videos.reduce<string | null>((m, v) => (!m || v.actualizado_en > m ? v.actualizado_en : m), null);

  return (
    <main>
      <h1>Vídeos</h1>
      <p className="apagado pequeno">
        {activos.length} en marcha · datos del PC {haceCuanto(ultimo)}
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

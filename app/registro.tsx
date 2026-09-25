import Link from "next/link";
import { fecha, resultadoClase } from "@/lib/formato";

type Fila = {
  id: number;
  agente: string;
  video_id: string | null;
  fin: string | null;
  resultado: string | null;
  resumen: string | null;
};

export default function Registro({ filas, conVideo = false }: { filas: Fila[]; conVideo?: boolean }) {
  if (!filas.length) return <p className="apagado">Sin actividad todavía.</p>;
  return (
    <ol className="registro">
      {filas.map((f) => (
        <li key={f.id}>
          <div className="fila">
            <span className={`punto ${resultadoClase(f.resultado)}`} aria-hidden />
            <strong>{f.agente}</strong>
            {conVideo && f.video_id && (
              <Link href={`/videos/${f.video_id}`} className="codigo">
                {f.video_id}
              </Link>
            )}
            <span className="apagado pequeno derecha">{fecha(f.fin)}</span>
          </div>
          {f.resumen && <p className="resumen">{f.resumen}</p>}
        </li>
      ))}
    </ol>
  );
}

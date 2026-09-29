import { Fila, Lista, Punto, Vacio } from "@/components/ui";
import type { Ejecucion } from "@/lib/datos/actividad";
import { estadoResultado } from "@/lib/estados";
import { agruparPor, diaRelativo, hora } from "@/lib/formato";
import s from "./Registro.module.css";

// Lo que han hecho los agentes, agrupado por días («Hoy», «Ayer», «lun 28 sep»).
// conVideo: enseña el código del vídeo y deja pulsar la fila para ir a él.
export function Registro({ filas, conVideo = false }: { filas: Ejecucion[]; conVideo?: boolean }) {
  if (!filas.length) {
    return <Vacio icono="reloj" tono="neutro" titulo="Sin actividad todavía" />;
  }
  return (
    <div className={s.registro}>
      {agruparPor(filas, (f) => diaRelativo(f.fin)).map((g) => (
        <div key={g.etiqueta} className={s.dia}>
          <h3 className={s.etiqueta}>{g.etiqueta}</h3>
          <Lista>
            {g.items.map((f) => {
              const r = estadoResultado(f.resultado);
              return (
                <Fila
                  key={f.id}
                  href={conVideo && f.video_id ? `/videos/${f.video_id}` : undefined}
                  inicio={<Punto tono={r.tono} titulo={r.texto} />}
                  titulo={
                    <>
                      {f.agente}
                      {conVideo && f.video_id && <span className={`codigo ${s.video}`}>{f.video_id}</span>}
                    </>
                  }
                  detalle={f.resumen}
                  fin={f.fin ? hora(f.fin) : "en marcha"}
                />
              );
            })}
          </Lista>
        </div>
      ))}
    </div>
  );
}

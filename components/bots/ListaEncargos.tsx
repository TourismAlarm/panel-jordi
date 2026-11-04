import { Desplegable, Etiqueta } from "@/components/ui";
import type { Tono } from "@/components/ui";
import type { PreguntaEncargo } from "@/lib/bots/edicion";
import type { Encargo } from "@/lib/datos/encargos";
import { haceCuanto } from "@/lib/formato";

const ESTADO: Record<string, { texto: string; tono: Tono }> = {
  pendiente: { texto: "En la cola", tono: "info" },
  en_curso: { texto: "Montándose en el PC", tono: "info" },
  listo: { texto: "Entregado", tono: "ojo" },
  aprobado: { texto: "Aprobado", tono: "bien" },
  cambios: { texto: "Con cambios", tono: "ojo" },
  sustituido: { texto: "Sustituido", tono: "neutro" },
  bloqueado: { texto: "El PC pregunta", tono: "ojo" },
  fallido: { texto: "Ha fallado", tono: "mal" },
};
const FASE: Record<string, string> = { corte: "Corte", acabado: "Acabado" };

// Las versiones del montaje de un vídeo, la última abierta: estado, enlace, notas y lo que preguntó el PC.
export function ListaEncargos({ encargos }: { encargos: Encargo[] }) {
  return (
    <>
      {encargos.map((e, i) => {
        const estado = ESTADO[e.estado] ?? { texto: e.estado, tono: "neutro" as Tono };
        const preguntas = Array.isArray(e.preguntas) ? (e.preguntas as PreguntaEncargo[]) : [];
        const video = e.final_url ?? e.resultado_url;
        return (
          <Desplegable
            key={e.id}
            abierto={i === 0}
            titulo={
              <>
                <Etiqueta tono={estado.tono}>{estado.texto}</Etiqueta> {FASE[e.fase] ?? e.fase} · versión {e.version} · {haceCuanto(e.terminado_en ?? e.tomado_en ?? e.creado)}
              </>
            }
          >
            {video && (
              <p className="pequeno">
                <a href={video} target="_blank" rel="noreferrer">
                  {e.final_url ? "Ver el FINAL" : "Ver el vídeo"}
                </a>
                {e.duracion_real_s != null && ` · ${e.duracion_real_s} s`}
              </p>
            )}
            {e.feedback && <p className="suave pequeno">Qué cambia: {e.feedback}</p>}
            {e.decision_jordi && <p className="suave pequeno">Pediste: {e.decision_jordi}</p>}
            {e.resultado_notas && <p className="suave pequeno">Notas del PC: {e.resultado_notas}</p>}
            {e.error && <p className="pequeno">Error: {e.error}</p>}
            {preguntas.map((p) => (
              <p key={p.texto} className="suave pequeno">
                {p.texto}
                {p.respuesta ? ` → ${p.respuesta}` : " (esperando a Antonio)"}
              </p>
            ))}
          </Desplegable>
        );
      })}
    </>
  );
}

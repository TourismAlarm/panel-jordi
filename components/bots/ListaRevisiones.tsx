import { Desplegable, Etiqueta, Fila, Lista, Punto } from "@/components/ui";
import type { Tono } from "@/components/ui";
import { nombreBot } from "@/lib/bots/catalogo";
import { haceCuanto } from "@/lib/formato";
import type { Revision } from "@/lib/datos/bots";

type PorRegla = { clave: string; estado: string; evidencia?: string };

const ESTADO: Record<string, { texto: string; tono: Tono }> = {
  no_cumple: { texto: "No cumple", tono: "mal" },
  cumple: { texto: "Cumple", tono: "bien" },
  no_aplica: { texto: "No aplica", tono: "neutro" },
};
const ORDEN: Record<string, number> = { no_cumple: 0, cumple: 1, no_aplica: 2 };
const FASE: Record<string, string> = { guion: "Guion", corte: "Corte", acabado: "Acabado" };

// Lo que dijo el revisor, regla por regla: en rojo lo que falla (arriba) con su evidencia. Lo más reciente, abierto.
export function ListaRevisiones({ revisiones, reglas }: { revisiones: Revision[]; reglas: Record<string, string> }) {
  return (
    <>
      {revisiones.map((r, i) => {
        const filas = (Array.isArray(r.por_regla) ? (r.por_regla as PorRegla[]) : []).toSorted((a, b) => (ORDEN[a.estado] ?? 3) - (ORDEN[b.estado] ?? 3));
        const fallos = filas.filter((f) => f.estado === "no_cumple").length;
        return (
          <Desplegable
            key={r.id}
            abierto={i === 0}
            titulo={
              <>
                <Etiqueta tono={r.resultado === "ok" ? "bien" : "mal"}>{r.resultado === "ok" ? "Todo bien" : `${fallos} por cambiar`}</Etiqueta>{" "}
                {FASE[r.fase] ?? r.fase} · {nombreBot(r.bot)} · {haceCuanto(r.creado)}
              </>
            }
          >
            {r.resumen && <p className="pequeno">{r.resumen}</p>}
            <Lista>
              {filas.map((f) => {
                const e = ESTADO[f.estado] ?? ESTADO.no_aplica;
                return <Fila key={f.clave} inicio={<Punto tono={e.tono} titulo={e.texto} />} titulo={reglas[f.clave] ?? f.clave} detalle={f.evidencia} />;
              })}
            </Lista>
          </Desplegable>
        );
      })}
    </>
  );
}

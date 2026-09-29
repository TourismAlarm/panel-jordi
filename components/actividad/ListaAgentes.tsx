import { Fila, Lista, Punto } from "@/components/ui";
import type { EstadoAgente } from "@/lib/datos/actividad";
import { estadoResultado } from "@/lib/estados";
import { haceCuanto } from "@/lib/formato";

// Cada agente con cómo le fue la última vez y cuándo.
export function ListaAgentes({ agentes }: { agentes: EstadoAgente[] }) {
  return (
    <Lista>
      {agentes.map((a) => {
        const r = estadoResultado(a.resultado);
        return (
          <Fila
            key={a.agente}
            inicio={<Punto tono={r.tono} titulo={r.texto} />}
            titulo={a.agente}
            fin={a.fin ? haceCuanto(a.fin) : "en marcha"}
          />
        );
      })}
    </Lista>
  );
}

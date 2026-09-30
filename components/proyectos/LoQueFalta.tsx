import type { Paso } from "@/lib/pasos";
import { MarcaPaso } from "./MarcaPaso";
import s from "./Pasos.module.css";

// En la tarjeta: los próximos pasos sin hacer, en orden, y el resto resumido en una línea.
export function LoQueFalta({ pasos, cuantos = 2 }: { pasos: Paso[]; cuantos?: number }) {
  const numerados = pasos.map((p, i) => ({ ...p, numero: i + 1 }));
  const falta = numerados.filter((p) => p.estado !== "hecho");
  if (!falta.length) return null;
  const ahora = falta.slice(0, cuantos);
  const primeroTuyo = ahora.find((p) => p.estado === "tuyo");
  const despues = falta.slice(cuantos);
  return (
    <div>
      <ul className={s.falta}>
        {ahora.map((p) => (
          <li key={p.clave} data-estado={p.estado}>
            <MarcaPaso estado={p.estado} numero={p.numero} pequena />
            <span>
              {p.titulo}
              {/* Si es tuyo y no se hace con un botón, se dice dónde se hace */}
              {p === primeroTuyo && !p.accion && p.detalle && <span className={s.donde}>{p.detalle}</span>}
            </span>
          </li>
        ))}
      </ul>
      {!!despues.length && (
        <span className={s.despues}>Después: {despues.map((p) => p.titulo.toLowerCase()).join(" · ")}</span>
      )}
    </div>
  );
}

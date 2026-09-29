import type { Tono } from "./tono";
import s from "./Progreso.module.css";

// Barra partida en trozos, uno por paso, cada uno con el color de su estado.
export function Progreso({ partes, etiqueta }: { partes: Tono[]; etiqueta?: string }) {
  return (
    <div className={s.progreso} role="img" aria-label={etiqueta}>
      {partes.map((t, i) => (
        <i key={i} data-tono={t} />
      ))}
    </div>
  );
}

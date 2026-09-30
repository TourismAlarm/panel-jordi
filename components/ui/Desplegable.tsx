import type { ReactNode } from "react";
import { Icono } from "./Icono";
import s from "./Desplegable.module.css";

// Bloque que se abre y se cierra tocando el título. Sin JavaScript: <details> de toda la vida.
export function Desplegable({
  titulo,
  abierto = false,
  children,
}: {
  titulo: ReactNode;
  abierto?: boolean;
  children: ReactNode;
}) {
  return (
    <details className={s.desplegable} open={abierto}>
      <summary className={s.titulo}>
        <span className={s.texto}>{titulo}</span>
        <span className={s.flecha}>
          <Icono nombre="flecha" tamano={20} />
        </span>
      </summary>
      <div className={s.cuerpo}>{children}</div>
    </details>
  );
}

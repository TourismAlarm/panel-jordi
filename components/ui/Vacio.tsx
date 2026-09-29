import type { ReactNode } from "react";
import { Icono, type NombreIcono } from "./Icono";
import type { Tono } from "./tono";
import s from "./Vacio.module.css";

// Lo que se enseña cuando no hay nada: mejor un mensaje claro que un hueco.
export function Vacio({
  titulo,
  texto,
  icono = "check",
  tono = "bien",
  children,
}: {
  titulo: string;
  texto?: string;
  icono?: NombreIcono;
  tono?: Tono;
  children?: ReactNode; // p. ej. un botón
}) {
  return (
    <div className={s.vacio} data-tono={tono}>
      <span className={s.icono}>
        <Icono nombre={icono} tamano={26} />
      </span>
      <strong>{titulo}</strong>
      {texto && <p className={s.texto}>{texto}</p>}
      {children}
    </div>
  );
}

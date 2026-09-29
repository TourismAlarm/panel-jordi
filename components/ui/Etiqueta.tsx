import type { ReactNode } from "react";
import type { Tono } from "./tono";
import s from "./Etiqueta.module.css";

// Pastilla de estado: punto + texto en el color del tono. «● Te toca revisar»
export function Etiqueta({ tono = "neutro", children }: { tono?: Tono; children: ReactNode }) {
  return (
    <span className={s.etiqueta} data-tono={tono}>
      <i className={s.punto} aria-hidden />
      {children}
    </span>
  );
}

// Solo el punto de color, para listas donde el texto ya está al lado.
export function Punto({ tono = "neutro", titulo }: { tono?: Tono; titulo?: string }) {
  return <i className={s.punto} data-tono={tono} title={titulo} aria-label={titulo} role={titulo ? "img" : undefined} />;
}

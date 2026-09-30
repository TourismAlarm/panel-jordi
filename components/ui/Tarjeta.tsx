import Link from "next/link";
import type { ReactNode } from "react";
import { Icono } from "./Icono";
import type { Tono } from "./tono";
import s from "./Tarjeta.module.css";

type Props = {
  href?: string; // si lleva enlace, se puede pulsar entera y enseña la flecha
  tono?: Tono; // pinta el borde izquierdo con el color del tono
  destacada?: boolean; // borde de color alrededor: «esto es lo importante ahora»
  children: ReactNode;
};

// Caja blanca con el contenido apilado. La pieza más usada de la app.
export function Tarjeta({ href, tono, destacada, children }: Props) {
  const clase = [s.tarjeta, tono && s.conTono, destacada && s.destacada, href && s.pulsable].filter(Boolean).join(" ");
  if (!href) {
    return (
      <div className={clase} data-tono={tono}>
        {children}
      </div>
    );
  }
  return (
    <Link href={href} className={clase} data-tono={tono}>
      <span className={s.contenido}>{children}</span>
      <span className={s.flecha}>
        <Icono nombre="flecha" tamano={20} />
      </span>
    </Link>
  );
}

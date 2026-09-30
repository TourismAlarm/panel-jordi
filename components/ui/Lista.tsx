import Link from "next/link";
import type { ReactNode } from "react";
import { Icono } from "./Icono";
import s from "./Lista.module.css";

// Caja con filas separadas por una línea fina (como los ajustes del móvil).
export function Lista({ children }: { children: ReactNode }) {
  return <div className={s.lista}>{children}</div>;
}

type FilaProps = {
  titulo: ReactNode;
  detalle?: ReactNode; // debajo del título, en gris o una Etiqueta
  inicio?: ReactNode; // a la izquierda: fecha, punto, icono…
  fin?: ReactNode; // a la derecha: hora, cifra…
  href?: string; // si lleva enlace, se puede pulsar y enseña la flecha
};

export function Fila({ titulo, detalle, inicio, fin, href }: FilaProps) {
  const dentro = (
    <>
      {inicio && <span className={s.inicio}>{inicio}</span>}
      <span className={s.textos}>
        <span className={s.titulo}>{titulo}</span>
        {detalle && <span className={s.detalle}>{detalle}</span>}
      </span>
      {fin && <span className={s.fin}>{fin}</span>}
      {href && (
        <span className={s.flecha}>
          <Icono nombre="flecha" tamano={18} />
        </span>
      )}
    </>
  );
  return href ? (
    <Link href={href} className={`${s.fila} ${s.pulsable}`}>
      {dentro}
    </Link>
  ) : (
    <div className={s.fila}>{dentro}</div>
  );
}

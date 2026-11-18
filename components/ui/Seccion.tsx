import Link from "next/link";
import type { ReactNode } from "react";
import s from "./Seccion.module.css";

type Props = {
  titulo: ReactNode;
  id?: string;
  cuenta?: number; // número pequeño al lado del título
  extra?: { texto: string; href: string }; // enlace a la derecha («Ver todo»)
  accion?: ReactNode; // o un elemento propio en ese mismo sitio (p. ej. un enlace de cliente)
  children: ReactNode;
};

// Bloque con título dentro de una pantalla.
export function Seccion({ titulo, id, cuenta, extra, accion, children }: Props) {
  return (
    <section className={s.seccion} id={id}>
      <div className={s.cabecera}>
        <h2>
          {titulo}
          {!!cuenta && <span className={s.cuenta}>{cuenta}</span>}
        </h2>
        {extra && (
          <Link href={extra.href} className={s.extra}>
            {extra.texto}
          </Link>
        )}
        {accion && <span className={s.extra}>{accion}</span>}
      </div>
      {children}
    </section>
  );
}

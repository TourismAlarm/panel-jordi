import Link from "next/link";
import type { ReactNode } from "react";
import s from "./Seccion.module.css";

type Props = {
  titulo: ReactNode;
  id?: string;
  cuenta?: number; // número pequeño al lado del título
  extra?: { texto: string; href: string }; // enlace a la derecha («Ver todo»)
  children: ReactNode;
};

// Bloque con título dentro de una pantalla.
export function Seccion({ titulo, id, cuenta, extra, children }: Props) {
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
      </div>
      {children}
    </section>
  );
}

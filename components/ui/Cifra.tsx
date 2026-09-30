import Link from "next/link";
import type { ReactNode } from "react";
import type { Tono } from "./tono";
import s from "./Cifra.module.css";

// Número grande con su nombre debajo. Se pulsa para ir al detalle.
export function Cifra({ valor, texto, tono = "neutro", href }: { valor: number; texto: string; tono?: Tono; href: string }) {
  return (
    <Link href={href} className={s.cifra} data-tono={tono}>
      <b>{valor}</b>
      <span>{texto}</span>
    </Link>
  );
}

// Rejilla de cifras: 2 por fila en el móvil, 4 en pantallas anchas.
export function Cifras({ children }: { children: ReactNode }) {
  return <div className={s.cifras}>{children}</div>;
}

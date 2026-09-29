import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import s from "./Boton.module.css";

export type Variante = "principal" | "secundario" | "peligro";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; compacto?: boolean };

function clases(variante: Variante, compacto?: boolean, extra?: string) {
  return [s.boton, s[variante], compacto && s.compacto, extra].filter(Boolean).join(" ");
}

// Botón grande y fácil de pulsar con el dedo. Para formularios, mejor BotonEnviar.
export function Boton({ variante = "principal", compacto, className, ...resto }: Props) {
  return <button className={clases(variante, compacto, className)} {...resto} />;
}

// Igual que Boton pero lleva a otra pantalla («Leer guion»). externo: abre fuera de la app (Gmail…).
export function BotonEnlace({
  href,
  variante = "principal",
  compacto,
  externo,
  children,
}: {
  href: string;
  variante?: Variante;
  compacto?: boolean;
  externo?: boolean;
  children: ReactNode;
}) {
  if (externo) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={clases(variante, compacto)}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={clases(variante, compacto)}>
      {children}
    </Link>
  );
}

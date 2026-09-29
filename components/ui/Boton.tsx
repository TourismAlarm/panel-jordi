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

// Igual que Boton pero lleva a otra pantalla («Leer guion»).
export function BotonEnlace({
  href,
  variante = "principal",
  compacto,
  children,
}: {
  href: string;
  variante?: Variante;
  compacto?: boolean;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={clases(variante, compacto)}>
      {children}
    </Link>
  );
}

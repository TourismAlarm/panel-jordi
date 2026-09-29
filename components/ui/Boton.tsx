import type { ButtonHTMLAttributes } from "react";
import s from "./Boton.module.css";

export type Variante = "principal" | "secundario" | "peligro";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante };

// Botón grande y fácil de pulsar con el dedo. Para formularios, mejor BotonEnviar.
export function Boton({ variante = "principal", className, ...resto }: Props) {
  return <button className={[s.boton, s[variante], className].filter(Boolean).join(" ")} {...resto} />;
}

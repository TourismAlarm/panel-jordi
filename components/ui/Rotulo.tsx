import type { ReactNode } from "react";
import s from "./Rotulo.module.css";

// Rótulo pequeño en mayúsculas para separar bloques de una lista («HOY», «MIÉ 23 SEP»).
export function Rotulo({ children, acento = false }: { children: ReactNode; acento?: boolean }) {
  return <h3 className={`${s.rotulo} ${acento ? s.acento : ""}`}>{children}</h3>;
}

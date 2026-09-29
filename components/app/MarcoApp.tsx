import type { ReactNode } from "react";
import { BarraPestanas } from "./BarraPestanas";
import s from "./MarcoApp.module.css";

// El armazón de la app una vez dentro: la pantalla de turno + la barra de pestañas abajo.
export function MarcoApp({ children }: { children: ReactNode }) {
  return (
    <>
      <div className={s.marco}>{children}</div>
      <BarraPestanas />
    </>
  );
}

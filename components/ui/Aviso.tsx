import type { ReactNode } from "react";
import { Icono, type NombreIcono } from "./Icono";
import type { Tono } from "./tono";
import s from "./Aviso.module.css";

const ICONO: Record<Tono, NombreIcono> = { bien: "check", ojo: "reloj", mal: "alerta", info: "reloj", neutro: "reloj" };

// Franja de color para avisar de algo sin interrumpir.
export function Aviso({ tono = "info", icono, children }: { tono?: Tono; icono?: NombreIcono; children: ReactNode }) {
  return (
    <div className={s.aviso} data-tono={tono} role={tono === "mal" ? "alert" : "status"}>
      <Icono nombre={icono ?? ICONO[tono]} tamano={20} />
      <div className={s.texto}>{children}</div>
    </div>
  );
}

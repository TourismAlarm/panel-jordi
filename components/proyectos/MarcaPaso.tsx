import { Icono } from "@/components/ui";
import { TONO_PASO, type EstadoPaso } from "@/lib/pasos";
import s from "./Pasos.module.css";

// Círculo del paso: ✓ si está hecho; si no, su número, con el color de quién lo tiene que hacer.
export function MarcaPaso({ estado, numero, pequena = false }: { estado: EstadoPaso; numero: number; pequena?: boolean }) {
  return (
    <span className={`${s.marca} ${pequena ? s.pequena : ""}`} data-tono={TONO_PASO[estado]} data-estado={estado}>
      {estado === "hecho" ? <Icono nombre="check" tamano={pequena ? 12 : 15} /> : numero}
    </span>
  );
}

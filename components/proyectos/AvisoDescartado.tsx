import Link from "next/link";
import { Tarjeta } from "@/components/ui";
import type { Peticion } from "@/lib/datos/peticiones";
import { estadoPeticion, textoMotivo } from "@/lib/estados";
import { haceCuanto } from "@/lib/formato";
import { BotonDeshacer } from "./BotonDeshacer";
import s from "./Peticiones.module.css";

// En la ficha de un proyecto descartado: por qué, si el PC ya lo sabe y cómo deshacerlo.
export function AvisoDescartado({ p }: { p: Peticion }) {
  return (
    <Tarjeta tono="mal">
      <div className={s.cabecera}>
        <div>
          <span className="codigo">DESCARTADO {haceCuanto(p.creada_en).toUpperCase()}</span>
          <strong className={s.motivo}>{textoMotivo(p.motivo)}</strong>
        </div>
        {!p.recogida_en && <BotonDeshacer id={p.id} />}
      </div>
      {p.texto && <p className="suave">«{p.texto}»</p>}
      <span className="suave pequeno">
        {p.estado === "hecha" ? "Hecho: el PC ya no trabaja más en él." : estadoPeticion(p).texto + "."}
      </span>
      <Link href="/nuevo" className={s.enlace}>
        ¿Hacemos un guion para otro trabajo? →
      </Link>
    </Tarjeta>
  );
}

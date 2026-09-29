import { BotonEnlace, Fila, Lista } from "@/components/ui";
import type { Paso } from "@/lib/pasos";
import { MarcaPaso } from "./MarcaPaso";
import s from "./Pasos.module.css";

const QUIEN = { tuyo: "Te toca", sistema: "Lo hace el PC", pendiente: "Más adelante", hecho: "Hecho" } as const;

// Todos los pasos del proyecto en orden, con quién los hace y un botón en los que son tuyos.
export function ListaPasos({ pasos }: { pasos: Paso[] }) {
  return (
    <Lista>
      {pasos.map((p, i) => (
        <Fila
          key={p.clave}
          inicio={<MarcaPaso estado={p.estado} numero={i + 1} />}
          titulo={<span className={p.estado === "hecho" ? s.hecho : undefined}>{p.titulo}</span>}
          detalle={
            <>
              <span className={s.quien} data-estado={p.estado}>
                {QUIEN[p.estado]}
              </span>
              {p.detalle && <span>{p.detalle}</span>}
            </>
          }
          fin={
            p.accion && p.estado !== "hecho" ? (
              <BotonEnlace href={p.accion.href} externo={p.accion.externo} variante={p.estado === "tuyo" ? "principal" : "secundario"} compacto>
                {p.accion.texto}
              </BotonEnlace>
            ) : undefined
          }
        />
      ))}
    </Lista>
  );
}

import Link from "next/link";
import { BotonEnlace, Icono, Progreso } from "@/components/ui";
import type { Proyecto } from "@/lib/datos/videos";
import { diaCercano } from "@/lib/formato";
import { pasoActual, TONO_PASO, type Paso } from "@/lib/pasos";
import { LoQueFalta } from "./LoQueFalta";
import s from "./TarjetaProyecto.module.css";

type Props = {
  p: Pick<Proyecto, "id" | "titulo" | "fecha_trabajo" | "ficha" | "tieneGuion">;
  pasos: Paso[];
  conFecha?: boolean; // en la portada la fecha ya va en el rótulo del día
};

// Un proyecto: cuándo, qué, dónde, camión, cómo va (barra de pasos), lo que falta en orden
// y el botón para hacer lo que te toca. Toda la tarjeta lleva a la ficha.
export function TarjetaProyecto({ p, pasos, conFecha = true }: Props) {
  const cuando = diaCercano(p.fecha_trabajo);
  const pronto = cuando === "Hoy" || cuando === "Mañana";
  const hechos = pasos.filter((x) => x.estado === "hecho").length;
  const actual = pasoActual(pasos);
  // Si el paso lleva al guion, ya lo cubre el botón «Guion»
  const accion = actual?.accion && !actual.accion.href.includes("/guion") ? actual.accion : null;
  const arriba = [conFecha ? cuando : null, p.ficha.hora].filter(Boolean).join(" · ");

  return (
    <article className={s.tarjeta} data-pronto={pronto || undefined}>
      <div className={s.arriba}>
        <span className={s.cuando}>{arriba}</span>
        <span className="codigo">{p.id}</span>
      </div>

      <Link href={`/videos/${p.id}`} className={s.titulo}>
        {p.titulo ?? p.id}
      </Link>

      {(p.ficha.lugar || p.ficha.camion) && (
        <div className={s.datos}>
          {p.ficha.lugar && (
            <span>
              <Icono nombre="lugar" tamano={16} />
              {p.ficha.lugar}
            </span>
          )}
          {p.ficha.camion && (
            <span>
              <Icono nombre="camion" tamano={16} />
              {p.ficha.camion}
            </span>
          )}
        </div>
      )}

      <div className={s.avance}>
        <Progreso partes={pasos.map((x) => TONO_PASO[x.estado])} etiqueta={`${hechos} de ${pasos.length} pasos hechos`} />
        <span className={s.cuenta}>
          {hechos}/{pasos.length}
        </span>
      </div>

      <LoQueFalta pasos={pasos} />

      {(accion || p.tieneGuion) && (
        <div className={s.botones}>
          {accion && (
            <BotonEnlace href={accion.href} externo={accion.externo} variante={actual?.estado === "tuyo" ? "principal" : "secundario"} compacto>
              {accion.texto}
            </BotonEnlace>
          )}
          {p.tieneGuion && (
            <BotonEnlace href={`/videos/${p.id}/guion`} variante="secundario" compacto>
              <Icono nombre="guion" tamano={18} />
              Guion
            </BotonEnlace>
          )}
        </div>
      )}
    </article>
  );
}

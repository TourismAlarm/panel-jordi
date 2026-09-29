import Link from "next/link";
import { BotonEnlace, Etiqueta, Icono } from "@/components/ui";
import type { Proyecto } from "@/lib/datos/videos";
import { estadoVideo } from "@/lib/estados";
import { diaCercano, plural } from "@/lib/formato";
import s from "./TarjetaProyecto.module.css";

type Props = {
  p: Pick<Proyecto, "id" | "titulo" | "estado" | "fecha_trabajo" | "por_revisar" | "ficha" | "tieneGuion">;
  preguntas?: number; // preguntas sin contestar de este proyecto
};

// Un proyecto en la portada: cuándo, qué, dónde, con qué camión, qué falta y el guion a un toque.
// Toda la tarjeta lleva a la ficha; el botón «Guion» va directo al modo lectura.
export function TarjetaProyecto({ p, preguntas = 0 }: Props) {
  const e = estadoVideo(p.estado);
  const cuando = diaCercano(p.fecha_trabajo);
  const pronto = cuando === "Hoy" || cuando === "Mañana";

  return (
    <article className={s.tarjeta} data-pronto={pronto || undefined}>
      <div className={s.arriba}>
        <span className={s.cuando}>
          {cuando}
          {p.ficha.hora && ` · ${p.ficha.hora}`}
        </span>
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

      <div className={s.pie}>
        <div className={s.etiquetas}>
          <Etiqueta tono={e.tono}>{e.texto}</Etiqueta>
          {!!preguntas && <Etiqueta tono="ojo">{plural(preguntas, "pregunta")}</Etiqueta>}
        </div>
        {p.tieneGuion && (
          <span className={s.accion}>
            <BotonEnlace href={`/videos/${p.id}/guion`} variante="secundario" compacto>
              <Icono nombre="guion" tamano={18} />
              Guion
            </BotonEnlace>
          </span>
        )}
      </div>
    </article>
  );
}

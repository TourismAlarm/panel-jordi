import Link from "next/link";
import type { ReactNode } from "react";
import { BotonActualizar } from "./BotonActualizar";
import { Icono } from "./Icono";
import s from "./Pantalla.module.css";

type Props = {
  titulo: ReactNode;
  antetitulo?: ReactNode; // línea pequeña encima del título (p. ej. el código del vídeo)
  subtitulo?: ReactNode; // línea gris debajo
  volver?: { href: string; texto: string };
  accion?: ReactNode | false; // arriba a la derecha; por defecto, el botón de actualizar
  children: ReactNode;
};

// Esqueleto de toda pantalla: cabecera con título + contenido apilado con el mismo aire.
export function Pantalla({ titulo, antetitulo, subtitulo, volver, accion, children }: Props) {
  return (
    <main className={s.pantalla}>
      {volver && (
        <Link href={volver.href} className={s.volver}>
          <Icono nombre="volver" tamano={20} />
          {volver.texto}
        </Link>
      )}
      <header className={s.cabecera}>
        <div className={s.textos}>
          {antetitulo && <span className="codigo">{antetitulo}</span>}
          <h1>{titulo}</h1>
          {subtitulo && <p className={s.subtitulo}>{subtitulo}</p>}
        </div>
        {accion !== false && <div className={s.accion}>{accion ?? <BotonActualizar />}</div>}
      </header>
      <div className={s.cuerpo}>{children}</div>
    </main>
  );
}

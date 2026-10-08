"use client";

import { useActionState } from "react";
import { AreaTexto, BotonEnviar, Campo, Entrada, ErrorCampo, Tarjeta } from "@/components/ui";
import { pedirEdicion } from "@/lib/acciones";
import s from "./Peticiones.module.css";

// Una urgencia ya grabada, sin guion: qué trabajo es y qué día. El PC crea el proyecto y su carpeta para subir el material.
export function FormEdicionSinGuion({ hoy }: { hoy: string }) {
  const [estado, accion] = useActionState(pedirEdicion, null);
  return (
    <Tarjeta>
      <form action={accion} className={s.form}>
        <Campo etiqueta="¿Qué trabajo es?">
          <AreaTexto name="texto" required placeholder="Ej.: urgencia, sacar una furgoneta volcada en la C-32 a la altura de Arenys con el 24" />
        </Campo>
        <Campo etiqueta="Día que lo grabaste">
          <Entrada name="fecha" type="date" defaultValue={hoy} max={hoy} />
        </Campo>
        <p className="suave pequeno">
          En unos minutos sale en Proyectos con su código y su carpeta en Drive (<em>contenido para claude</em>). Sube ahí lo grabado y pulsa «Ya he subido todo»: entra en la cola de montaje sin guion.
        </p>
        {estado?.error && <ErrorCampo>{estado.error}</ErrorCampo>}
        <BotonEnviar texto="Crear el proyecto" enviando="Enviando…" />
      </form>
    </Tarjeta>
  );
}

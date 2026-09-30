"use client";

import { useActionState, useState } from "react";
import { AreaTexto, Boton, BotonEnviar, Campo, ErrorCampo, Icono, Opciones, Tarjeta } from "@/components/ui";
import { descartar } from "@/lib/acciones";
import { MOTIVOS } from "@/lib/estados";
import s from "./Peticiones.module.css";

const OPCIONES = Object.entries(MOTIVOS).map(([valor, texto]) => ({ valor, texto }));

// «Este proyecto no». Primero un botón; al tocarlo, el motivo y una nota opcional para el guionista.
export function FormDescartar({ videoId }: { videoId: string }) {
  const [abierto, setAbierto] = useState(false);
  const [estado, accion] = useActionState(descartar, null);

  if (!abierto) {
    return (
      <Boton type="button" variante="peligro" onClick={() => setAbierto(true)}>
        <Icono nombre="papelera" tamano={20} />
        Descartar este proyecto
      </Boton>
    );
  }

  return (
    <Tarjeta tono="mal">
      <strong>¿Por qué lo descartas?</strong>
      <form action={accion} className={s.form}>
        <input type="hidden" name="video_id" value={videoId} />
        <Opciones nombre="motivo" opciones={OPCIONES} />
        <Campo etiqueta="Algo más para el guionista (opcional)">
          <AreaTexto name="texto" placeholder="Ej.: lo hizo el otro equipo · enfócalo en la grúa…" />
        </Campo>
        {estado?.error && <ErrorCampo>{estado.error}</ErrorCampo>}
        <BotonEnviar texto="Descartar" enviando="Descartando…" variante="peligro" />
        <Boton type="button" variante="secundario" onClick={() => setAbierto(false)}>
          Cancelar
        </Boton>
      </form>
    </Tarjeta>
  );
}

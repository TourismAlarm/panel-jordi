"use client";

import { useActionState } from "react";
import { AreaTexto, BotonEnviar, Campo, Entrada, ErrorCampo, Tarjeta } from "@/components/ui";
import { pedirGuion } from "@/lib/acciones";
import s from "./Peticiones.module.css";

// Pedir un guion para otro trabajo: qué es y qué día. El PC se lo pasa al guionista.
export function FormPedirGuion() {
  const [estado, accion] = useActionState(pedirGuion, null);
  return (
    <Tarjeta>
      <form action={accion} className={s.form}>
        <Campo etiqueta="¿Qué trabajo es?">
          <AreaTexto
            name="texto"
            required
            placeholder="Ej.: jueves, subir un aire acondicionado a una azotea en Mataró con el 23"
          />
        </Campo>
        <Campo etiqueta="Día del trabajo (si lo sabes)">
          <Entrada name="fecha" type="date" />
        </Campo>
        {estado?.error && <ErrorCampo>{estado.error}</ErrorCampo>}
        <BotonEnviar texto="Pedir guion" enviando="Enviando…" />
      </form>
    </Tarjeta>
  );
}

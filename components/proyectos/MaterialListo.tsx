"use client";

import { useActionState } from "react";
import { BotonEnviar, ErrorCampo, Tarjeta } from "@/components/ui";
import { materialListo } from "@/lib/acciones";
import type { Peticion } from "@/lib/datos/peticiones";
import { estadoPeticion } from "@/lib/estados";
import { BotonDeshacer } from "./BotonDeshacer";
import s from "./Peticiones.module.css";

// «Ya he subido todo»: mientras no lo pulses, el PC no mira ni monta este material.
// Así los agentes trabajan una sola vez con todo y no se gastan tokens montando a medias.
export function MaterialListo({ videoId, peticion }: { videoId: string; peticion?: Peticion }) {
  const [estado, accion] = useActionState(materialListo, null);

  if (peticion) {
    return (
      <Tarjeta tono="info">
        <div className={s.cabecera}>
          <div>
            <strong>Material entregado</strong>
            <span className="suave pequeno">{estadoPeticion(peticion).texto}. El montaje empieza en el siguiente ciclo del PC.</span>
          </div>
          {!peticion.recogida_en && <BotonDeshacer id={peticion.id} />}
        </div>
      </Tarjeta>
    );
  }

  return (
    <form action={accion} className={s.form}>
      <p className="suave pequeno">
        Sube todo lo grabado a Drive, en <em>contenido para claude</em> › la carpeta que empieza por <strong>{videoId}</strong> (o en el PC, <code>videos/_entrada/{videoId}/</code>). Los agentes no tocan este vídeo hasta que pulses el botón: así montan una sola vez, con todo el material.
      </p>
      <input type="hidden" name="video_id" value={videoId} />
      <BotonEnviar texto="Ya he subido todo" enviando="Avisando al PC…" />
      {estado?.error && <ErrorCampo>{estado.error}</ErrorCampo>}
    </form>
  );
}

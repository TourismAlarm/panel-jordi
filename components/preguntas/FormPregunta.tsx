"use client";

import { useActionState } from "react";
import { AreaTexto, Aviso, BotonEnviar, ErrorCampo, Etiqueta, Tarjeta } from "@/components/ui";
import { responder } from "@/lib/acciones";
import { estadoPregunta, fasePregunta } from "@/lib/estados";
import type { Pregunta } from "@/lib/datos/preguntas";
import s from "./FormPregunta.module.css";

type P = Pick<Pregunta, "id" | "clave" | "texto" | "respuesta" | "respondida_en" | "recogida_en">;

// Una pregunta del guionista con su caja para contestar (o la respuesta, si el PC ya la recogió).
export function FormPregunta({ videoId, p }: { videoId: string; p: P }) {
  const [estado, accion] = useActionState(responder, null);
  const fase = fasePregunta(p);
  const e = estadoPregunta(p);

  return (
    <Tarjeta tono={fase === "pendiente" ? "ojo" : undefined}>
      <p className={s.pregunta}>
        <span className="codigo">{p.clave}</span> {p.texto}
      </p>
      <Etiqueta tono={e.tono}>{e.texto}</Etiqueta>

      {fase === "recogida" ? (
        <p className={s.respuesta}>{p.respuesta}</p>
      ) : (
        <form action={accion} className={s.form}>
          <input type="hidden" name="id" value={p.id} />
          <input type="hidden" name="video_id" value={videoId} />
          <AreaTexto
            name="respuesta"
            defaultValue={p.respuesta ?? ""}
            placeholder="Tu respuesta…"
            aria-label={`Respuesta a ${p.clave}`}
          />
          {estado?.error && <ErrorCampo>{estado.error}</ErrorCampo>}
          {estado?.ok && <Aviso tono="bien">Guardada. Pendiente de que la recoja el PC.</Aviso>}
          <BotonEnviar texto={fase === "enviada" ? "Cambiar respuesta" : "Enviar"} />
        </form>
      )}
    </Tarjeta>
  );
}

"use client";

import { useActionState } from "react";
import { responder } from "@/app/acciones";

type P = {
  id: string;
  clave: string;
  texto: string;
  respuesta: string | null;
  respondida_en: string | null;
  recogida_en: string | null;
};

function punto(p: P) {
  if (p.recogida_en) return { texto: "Recogida en preguntas.md", clase: "ok" };
  if (p.respondida_en) return { texto: "Enviada · esperando sync", clase: "espera" };
  return { texto: "Pendiente", clase: "pendiente" };
}

export default function Pregunta({ videoId, p }: { videoId: string; p: P }) {
  const [estado, accion, enviando] = useActionState(responder, null);
  const e = punto(p);

  return (
    <div className="tarjeta">
      <p className="pregunta">
        <span className="codigo">{p.clave}</span> {p.texto}
      </p>
      <p><span className={`estado ${e.clase}`}>{e.texto}</span></p>
      {p.recogida_en ? (
        <p className="respuesta">{p.respuesta}</p>
      ) : (
        <form action={accion}>
          <input type="hidden" name="id" value={p.id} />
          <input type="hidden" name="video_id" value={videoId} />
          <textarea name="respuesta" rows={3} defaultValue={p.respuesta ?? ""} placeholder="Tu respuesta" />
          {estado?.error && <p className="error">{estado.error}</p>}
          <button disabled={enviando}>
            {enviando ? "Enviando…" : p.respondida_en ? "Cambiar respuesta" : "Enviar"}
          </button>
        </form>
      )}
    </div>
  );
}

"use client";

import { useActionState, useState } from "react";
import { AreaTexto, Boton, BotonEnlace, BotonEnviar, Campo, ErrorCampo, Icono, Tarjeta } from "@/components/ui";
import { revisarMontaje } from "@/lib/acciones";
import type { Peticion } from "@/lib/datos/peticiones";
import { estadoPeticion } from "@/lib/estados";
import { BotonDeshacer } from "./BotonDeshacer";
import s from "./Peticiones.module.css";

// Revisar el montaje sin abrir el correo: verlo, aprobarlo o pedir cambios.
// Si ya has mandado una de las dos y el PC no la ha terminado, se enseña en qué punto está en vez de los botones.
export function RevisarMontaje({ videoId, montajeUrl, revision }: { videoId: string; montajeUrl: string | null; revision?: Peticion }) {
  const [pidiendo, setPidiendo] = useState(false);
  const [aprobar, accionAprobar] = useActionState(revisarMontaje, null);
  const [cambios, accionCambios] = useActionState(revisarMontaje, null);

  if (revision && revision.estado !== "fallida" && revision.estado !== "hecha") {
    return (
      <Tarjeta tono="info">
        <div className={s.cabecera}>
          <div>
            <strong>{revision.tipo === "aprobar" ? "Aprobado" : "Cambios enviados"}</strong>
            <span className="suave pequeno">{estadoPeticion(revision).texto}. Se actualiza en el siguiente ciclo del PC.</span>
          </div>
          {!revision.recogida_en && <BotonDeshacer id={revision.id} />}
        </div>
        {revision.texto && <p className="suave">«{revision.texto}»</p>}
        {revision.siempre && <span className="suave pequeno">Y se guarda como regla del montador.</span>}
      </Tarjeta>
    );
  }

  return (
    <div className={s.form}>
      {revision?.estado === "fallida" && (
        <Tarjeta tono="mal">
          <strong>{revision.tipo === "aprobar" ? "No se pudo aprobar" : "No se pudieron pasar los cambios"}</strong>
          <span className="suave pequeno">{estadoPeticion(revision).texto}</span>
        </Tarjeta>
      )}

      {montajeUrl ? (
        <BotonEnlace href={montajeUrl} externo>
          <Icono nombre="flecha" />
          Ver montaje
        </BotonEnlace>
      ) : (
        <Tarjeta>
          <span className="suave">Todavía no hay enlace al montaje. Aparece aquí en el siguiente ciclo del PC; mientras, tienes el correo «montaje listo».</span>
        </Tarjeta>
      )}

      <form action={accionAprobar}>
        <input type="hidden" name="video_id" value={videoId} />
        <input type="hidden" name="tipo" value="aprobar" />
        <BotonEnviar texto="Aprobar" enviando="Aprobando…" />
        {aprobar?.error && <ErrorCampo>{aprobar.error}</ErrorCampo>}
      </form>

      {!pidiendo ? (
        <Boton type="button" variante="secundario" onClick={() => setPidiendo(true)}>
          Pedir cambios
        </Boton>
      ) : (
        <form action={accionCambios} className={s.form}>
          <input type="hidden" name="video_id" value={videoId} />
          <input type="hidden" name="tipo" value="cambios" />
          <Campo etiqueta="¿Qué quieres cambiar?">
            <AreaTexto name="texto" required placeholder="Ej.: en 00:12 deja el sonido real · quita el rótulo del final…" />
          </Campo>
          <label className={s.casilla}>
            <input type="checkbox" name="siempre" />
            <span>
              Hazlo siempre así
              <span className="suave pequeno"> — el montador lo guarda como regla para todos los vídeos (la ves y la quitas en Aprende)</span>
            </span>
          </label>
          {cambios?.error && <ErrorCampo>{cambios.error}</ErrorCampo>}
          <BotonEnviar texto="Enviar cambios" enviando="Enviando…" variante="secundario" />
          <Boton type="button" variante="secundario" onClick={() => setPidiendo(false)}>
            Cancelar
          </Boton>
        </form>
      )}
    </div>
  );
}

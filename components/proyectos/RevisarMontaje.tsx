"use client";

import { useActionState, useState } from "react";
import { AreaTexto, Boton, BotonEnlace, BotonEnviar, Campo, ErrorCampo, Icono, Tarjeta } from "@/components/ui";
import { revisarMontaje } from "@/lib/acciones";
import type { Peticion } from "@/lib/datos/peticiones";
import { estadoPeticion } from "@/lib/estados";
import { BotonDeshacer } from "./BotonDeshacer";
import s from "./Peticiones.module.css";

// Revisar el montaje sin abrir el correo. Va en dos fases:
// · corte (corte_listo): el vídeo de ffmpeg, sin subtítulos ni título → «Corte OK» o pedir cambios.
// · acabado (acabado_listo): el proyecto de ChatCut con subtítulos y título → aprobar o pedir cambios.
// (revision_jordi = vídeos del flujo antiguo, de una sola fase: aprobar o pedir cambios.)
// Si ya has mandado una y el PC no la ha terminado, se enseña en qué punto está en vez de los botones.
const TITULO_ENVIADA: Record<string, string> = { aprobar: "Aprobado", corte_ok: "Corte OK", cambios: "Cambios enviados" };
const TITULO_FALLIDA: Record<string, string> = {
  aprobar: "No se pudo aprobar",
  corte_ok: "No se pudo dar el corte por bueno",
  cambios: "No se pudieron pasar los cambios",
};

export function RevisarMontaje({
  videoId,
  estado,
  montajeUrl,
  revision,
}: {
  videoId: string;
  estado: string;
  montajeUrl: string | null;
  revision?: Peticion;
}) {
  const [pidiendo, setPidiendo] = useState(false);
  const [aprobar, accionAprobar] = useActionState(revisarMontaje, null);
  const [cambios, accionCambios] = useActionState(revisarMontaje, null);
  const corte = estado === "corte_listo";
  const acabado = estado === "acabado_listo";

  if (revision && revision.estado !== "fallida" && revision.estado !== "hecha") {
    return (
      <Tarjeta tono="info">
        <div className={s.cabecera}>
          <div>
            <strong>{TITULO_ENVIADA[revision.tipo] ?? "Enviado"}</strong>
            <span className="suave pequeno">
              {estadoPeticion(revision).texto}. Se actualiza en el siguiente ciclo del PC.
              {revision.tipo === "corte_ok" && " Luego le pone subtítulos y título en ChatCut y te avisa."}
            </span>
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
          <strong>{TITULO_FALLIDA[revision.tipo] ?? "No se pudo hacer"}</strong>
          <span className="suave pequeno">{estadoPeticion(revision).texto}</span>
        </Tarjeta>
      )}

      {corte && (
        <p className="suave pequeno">
          Es el corte: sin subtítulos ni título. Mira qué planos entran, el orden y el ritmo. Con «Corte OK» el PC le pone subtítulos y
          título en ChatCut y te lo vuelve a pasar.
        </p>
      )}
      {acabado && (
        <p className="suave pequeno">Acabado en ChatCut: subtítulos, título y transiciones. Al aprobarlo, el PC exporta el vídeo final.</p>
      )}

      {montajeUrl ? (
        <BotonEnlace href={montajeUrl} externo>
          <Icono nombre="flecha" />
          {corte ? "Ver el corte" : acabado && montajeUrl.includes("chatcut") ? "Abrir en ChatCut" : "Ver montaje"}
        </BotonEnlace>
      ) : (
        <Tarjeta>
          <span className="suave">Todavía no hay enlace al montaje. Aparece aquí en el siguiente ciclo del PC.</span>
        </Tarjeta>
      )}

      <form action={accionAprobar}>
        <input type="hidden" name="video_id" value={videoId} />
        <input type="hidden" name="tipo" value={corte ? "corte_ok" : "aprobar"} />
        <BotonEnviar texto={corte ? "Corte OK" : "Aprobar"} enviando={corte ? "Guardando…" : "Aprobando…"} />
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
          <Campo etiqueta={corte ? "¿Qué cambias del corte?" : "¿Qué quieres cambiar?"}>
            <AreaTexto
              name="texto"
              required
              placeholder={
                corte
                  ? "Ej.: quita el plano de 00:12 · más rápido el desplazamiento · acaba con la azotea llena…"
                  : "Ej.: sube los subtítulos · cambia el título por… · quita la transición del final…"
              }
            />
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

"use client";

import { useActionState, useState } from "react";
import { AreaTexto, Boton, BotonEnviar, Campo, ErrorCampo, Etiqueta, Tarjeta } from "@/components/ui";
import { decidirRegla } from "@/lib/acciones";
import type { Regla } from "@/lib/datos/reglas";
import s from "./Reglas.module.css";

const ORIGEN: Record<string, string> = {
  retro: "De tus correcciones",
  analista: "De las estadísticas",
  correccion: "Lo marcaste como «siempre así»",
  manual: "Guardada a mano",
};

// Una regla propuesta: Sí / No / Sí pero cambiada. Un toque y el PC la aplica en el siguiente ciclo.
export function TarjetaPropuesta({ r }: { r: Regla }) {
  const [estado, accion] = useActionState(decidirRegla, null);
  const [cambiando, setCambiando] = useState(false);
  return (
    <Tarjeta tono="ojo">
      <div className={s.cabecera}>
        <Etiqueta tono="info">{r.agente}</Etiqueta>
        <span className="suave pequeno">{ORIGEN[r.origen] ?? r.origen}</span>
      </div>
      <p className={s.regla}>{r.regla}</p>
      {r.evidencia && <p className="suave pequeno">Por qué: {r.evidencia}</p>}
      {r.medida && <p className="suave pequeno">Cómo sabremos si funciona: {r.medida}</p>}

      {!cambiando ? (
        <div className={s.botones}>
          <form action={accion}>
            <input type="hidden" name="id" value={r.id} />
            <input type="hidden" name="decision" value="si" />
            <BotonEnviar texto="Sí" enviando="Guardando…" compacto />
          </form>
          <form action={accion}>
            <input type="hidden" name="id" value={r.id} />
            <input type="hidden" name="decision" value="no" />
            <BotonEnviar texto="No" enviando="Guardando…" variante="secundario" compacto />
          </form>
          <Boton type="button" variante="secundario" compacto onClick={() => setCambiando(true)}>
            Sí, pero así…
          </Boton>
        </div>
      ) : (
        <form action={accion} className={s.form}>
          <input type="hidden" name="id" value={r.id} />
          <input type="hidden" name="decision" value="si" />
          <Campo etiqueta="Escríbela como la quieres">
            <AreaTexto name="texto" required defaultValue={r.regla} />
          </Campo>
          <div className={s.botones}>
            <BotonEnviar texto="Guardar así" enviando="Guardando…" compacto />
            <Boton type="button" variante="secundario" compacto onClick={() => setCambiando(false)}>
              Cancelar
            </Boton>
          </div>
        </form>
      )}
      {estado?.error && <ErrorCampo>{estado.error}</ErrorCampo>}
    </Tarjeta>
  );
}

// Ya decidida, esperando a que el PC la aplique: se puede deshacer.
export function TarjetaEsperando({ r }: { r: Regla }) {
  const [estado, accion] = useActionState(decidirRegla, null);
  const que =
    r.decision === "quitar" ? "La quitas" : r.decision === "no" ? "Le has dicho que no" : r.decision_texto ? "Sí, cambiada" : "Le has dicho que sí";
  return (
    <Tarjeta tono="info">
      <div className={s.cabecera}>
        <Etiqueta tono="info">{r.agente}</Etiqueta>
        <form action={accion}>
          <input type="hidden" name="id" value={r.id} />
          <input type="hidden" name="decision" value="deshacer" />
          <BotonEnviar texto="Deshacer" enviando="Deshaciendo…" variante="secundario" compacto />
        </form>
      </div>
      <p className={s.regla}>{r.decision_texto || r.regla}</p>
      <span className="suave pequeno">{que}. Se aplica en el siguiente ciclo del PC.</span>
      {estado?.error && <ErrorCampo>{estado.error}</ErrorCampo>}
    </Tarjeta>
  );
}

// Activa: la aplica su agente cada vez. Se puede quitar.
export function FilaActiva({ r }: { r: Regla }) {
  const [estado, accion] = useActionState(decidirRegla, null);
  return (
    <div className={s.activa}>
      <p className={s.regla}>{r.regla}</p>
      <form action={accion}>
        <input type="hidden" name="id" value={r.id} />
        <input type="hidden" name="decision" value="quitar" />
        <BotonEnviar texto="Quitar" enviando="Quitando…" variante="secundario" compacto />
      </form>
      {estado?.error && <ErrorCampo>{estado.error}</ErrorCampo>}
    </div>
  );
}

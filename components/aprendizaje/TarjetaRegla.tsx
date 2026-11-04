"use client";

import { useActionState, useState } from "react";
import { AreaTexto, Boton, BotonEnviar, Campo, ErrorCampo, Etiqueta, Tarjeta } from "@/components/ui";
import { decidirRegla } from "@/lib/acciones";
import { quienYQue, seDeshace } from "@/lib/bots/reglas";
import type { CambioDeRegla, Regla } from "@/lib/datos/reglas";
import { fecha } from "@/lib/formato";
import s from "./Reglas.module.css";

const ORIGEN: Record<string, string> = {
  retro: "De tus correcciones",
  analista: "De las estadísticas",
  correccion: "Lo marcaste como «siempre así»",
  manual: "Guardada a mano",
  antonio: "De Antonio",
};

// Una regla propuesta: Sí / No / Sí pero cambiada. Un toque y se aplica al momento.
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

// Quién la tocó por última vez, cuándo, por qué y qué ponía antes. Se puede deshacer.
export function UltimoCambio({ c }: { c: CambioDeRegla }) {
  const [estado, accion] = useActionState(decidirRegla, null);
  const cambioElTexto = c.texto_antes && c.texto_antes !== c.texto_despues;
  return (
    <div className={s.cambio}>
      <p className="suave pequeno">
        {quienYQue(c)} · {fecha(c.creado)}
        {c.por_que && ` · ${c.por_que}`}
      </p>
      {cambioElTexto && <p className="suave pequeno">Antes: {c.texto_antes}</p>}
      {seDeshace(c) && (
        <form action={accion}>
          <input type="hidden" name="id" value={c.regla_id} />
          <input type="hidden" name="decision" value="deshacer" />
          <BotonEnviar texto="Deshacer" enviando="Deshaciendo…" variante="secundario" compacto />
        </form>
      )}
      {estado?.error && <ErrorCampo>{estado.error}</ErrorCampo>}
    </div>
  );
}

// Activa: la aplica su agente cada vez. Se puede quitar.
export function FilaActiva({ r, cambio }: { r: Regla; cambio?: CambioDeRegla }) {
  const [estado, accion] = useActionState(decidirRegla, null);
  return (
    <div className={s.fila}>
      <div className={s.activa}>
        <p className={s.regla}>{r.regla}</p>
        <form action={accion}>
          <input type="hidden" name="id" value={r.id} />
          <input type="hidden" name="decision" value="quitar" />
          <BotonEnviar texto="Quitar" enviando="Quitando…" variante="secundario" compacto />
        </form>
      </div>
      {cambio && <UltimoCambio c={cambio} />}
      {estado?.error && <ErrorCampo>{estado.error}</ErrorCampo>}
    </div>
  );
}

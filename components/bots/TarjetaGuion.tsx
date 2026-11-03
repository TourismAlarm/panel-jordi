"use client";

import { useActionState, useState } from "react";
import { AreaTexto, Boton, BotonEnviar, Campo, Desplegable, ErrorCampo, Etiqueta, Tarjeta } from "@/components/ui";
import { decidirGuion } from "@/lib/acciones";
import { nombreBot } from "@/lib/bots/catalogo";
import type { GuionPropuesto, Revision } from "@/lib/datos/bots";
import { ListaRevisiones } from "./ListaRevisiones";
import s from "./Bots.module.css";

const lista = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const textoDe = (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v));

// Propuesta de guion de un bot: se lee entera y se decide. Aprobada, espera a que el PC la convierta en vídeo GE.
export function TarjetaGuion({ g, revisiones, reglas }: { g: GuionPropuesto; revisiones: Revision[]; reglas: Record<string, string> }) {
  const [estado, accion] = useActionState(decidirGuion, null);
  const [cambiando, setCambiando] = useState(false);
  const textos = lista(g.textos_pantalla) as { texto?: string; segundo?: number }[];
  const preguntas = lista(g.preguntas);

  return (
    <Tarjeta tono={g.estado === "propuesto" ? "ojo" : g.estado === "aprobado" ? "bien" : "info"}>
      <div className={s.cabecera}>
        {g.estado === "aprobado" ? (
          <Etiqueta tono="bien">Aprobado · esperando al PC</Etiqueta>
        ) : g.estado === "cambios" ? (
          <Etiqueta tono="info">Cambios pedidos · le toca al bot</Etiqueta>
        ) : (
          <Etiqueta tono="ojo">Por aprobar</Etiqueta>
        )}
        <span className="suave pequeno">{nombreBot(g.fuente_bot)}{g.version > 1 ? ` · versión ${g.version}` : ""}</span>
      </div>
      <h3 className={s.titulo}>{g.titulo}</h3>
      <p className={s.gancho}>«{g.gancho}»</p>
      {g.duracion_s && <p className="suave pequeno">{g.duracion_s} s{g.tema ? ` · ${g.tema}` : ""}</p>}

      <Desplegable titulo="Leer el guion">
        <ol className={s.planos}>
          {lista(g.planos).map((p, i) => <li key={i}>{textoDe(p)}</li>)}
        </ol>
        {!!textos.length && (
          <>
            <p className="pequeno"><strong>Textos en pantalla</strong></p>
            <ul className={s.enlaces}>
              {textos.map((t, i) => <li key={i} className="pequeno">{t.segundo ?? 0} s: {t.texto}</li>)}
            </ul>
          </>
        )}
        {g.prueba && <p className="pequeno"><strong>Qué prueba:</strong> {g.prueba}</p>}
        {!!preguntas.length && (
          <>
            <p className="pequeno"><strong>Preguntas para ti</strong></p>
            <ul className={s.enlaces}>
              {preguntas.map((q, i) => <li key={i} className="pequeno">{textoDe(q)}</li>)}
            </ul>
          </>
        )}
      </Desplegable>

      {!!revisiones.length && <ListaRevisiones revisiones={revisiones} reglas={reglas} />}
      {g.nota_jordi && <p className="suave pequeno">Tu nota: {g.nota_jordi}</p>}

      {g.estado === "propuesto" && !cambiando && (
        <div className={s.botones}>
          <form action={accion}>
            <input type="hidden" name="id" value={g.id} />
            <input type="hidden" name="decision" value="aprobado" />
            <BotonEnviar texto="Aprobar" enviando="Guardando…" compacto />
          </form>
          <Boton type="button" variante="secundario" compacto onClick={() => setCambiando(true)}>Pedir cambios</Boton>
          <form action={accion}>
            <input type="hidden" name="id" value={g.id} />
            <input type="hidden" name="decision" value="descartado" />
            <BotonEnviar texto="Descartar" enviando="Guardando…" variante="secundario" compacto />
          </form>
        </div>
      )}
      {cambiando && (
        <form action={accion} className={s.form}>
          <input type="hidden" name="id" value={g.id} />
          <input type="hidden" name="decision" value="cambios" />
          <Campo etiqueta="¿Qué cambiarías?">
            <AreaTexto name="nota" required />
          </Campo>
          <div className={s.botones}>
            <BotonEnviar texto="Pedir cambios" enviando="Guardando…" compacto />
            <Boton type="button" variante="secundario" compacto onClick={() => setCambiando(false)}>Cancelar</Boton>
          </div>
        </form>
      )}
      {g.estado !== "propuesto" && !cambiando && (
        <form action={accion}>
          <input type="hidden" name="id" value={g.id} />
          <input type="hidden" name="decision" value="propuesto" />
          <BotonEnviar texto="Deshacer" enviando="Deshaciendo…" variante="secundario" compacto />
        </form>
      )}
      {estado?.error && <ErrorCampo>{estado.error}</ErrorCampo>}
    </Tarjeta>
  );
}

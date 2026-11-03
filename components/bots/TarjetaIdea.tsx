"use client";

import { useActionState } from "react";
import { AreaTexto, Boton, Campo, ErrorCampo, Etiqueta, Tarjeta } from "@/components/ui";
import { decidirIdea } from "@/lib/acciones";
import { nombreBot } from "@/lib/bots/catalogo";
import type { Idea } from "@/lib/datos/bots";
import s from "./Bots.module.css";

const ESTADO: Record<string, { texto: string; tono: "info" | "bien" | "neutro" }> = {
  nueva: { texto: "Por decidir", tono: "info" },
  me_gusta: { texto: "Te gusta · lista para el Guionista", tono: "bien" },
  descartada: { texto: "Descartada", tono: "neutro" },
  usada: { texto: "Ya tiene guion", tono: "neutro" },
};

// Una idea: gancho, formato y referencias. Me gusta la deja lista para el Guionista.
export function TarjetaIdea({ idea }: { idea: Idea }) {
  const [estado, accion] = useActionState(decidirIdea, null);
  const e = ESTADO[idea.estado] ?? ESTADO.nueva;
  const referencias = Array.isArray(idea.referencias) ? idea.referencias.filter((r): r is string => typeof r === "string") : [];

  return (
    <Tarjeta tono={idea.estado === "nueva" ? "info" : undefined}>
      <div className={s.cabecera}>
        <Etiqueta tono={e.tono}>{e.texto}</Etiqueta>
        <span className="suave pequeno">{nombreBot(idea.fuente_bot)}</span>
      </div>
      <h3 className={s.titulo}>{idea.titulo}</h3>
      <p className={s.gancho}>«{idea.gancho}»</p>
      {idea.formato && <p className="pequeno"><strong>Formato:</strong> {idea.formato}</p>}
      {idea.por_que_funciona && <p className="pequeno"><strong>Por qué funciona:</strong> {idea.por_que_funciona}</p>}
      {idea.trabajo_sugerido && <p className="pequeno"><strong>Trabajo sugerido:</strong> {idea.trabajo_sugerido}</p>}
      {!!referencias.length && (
        <ul className={s.enlaces}>
          {referencias.map((r, i) => (
            <li key={r}>
              <a href={r} target="_blank" rel="noopener noreferrer">Ver referencia {referencias.length > 1 ? i + 1 : ""}</a>
            </li>
          ))}
        </ul>
      )}

      {idea.estado === "usada" ? (
        idea.nota_jordi && <p className="suave pequeno">Tu nota: {idea.nota_jordi}</p>
      ) : (
        <form action={accion} className={s.form}>
          <input type="hidden" name="id" value={idea.id} />
          <Campo etiqueta="Nota (opcional)">
            <AreaTexto name="nota" defaultValue={idea.nota_jordi ?? ""} rows={2} />
          </Campo>
          <div className={s.botones}>
            {idea.estado !== "me_gusta" && <BotonDecision valor="me_gusta" texto="Me gusta" />}
            {idea.estado !== "descartada" && <BotonDecision valor="descartada" texto="Descartar" secundario />}
            {idea.estado !== "nueva" && <BotonDecision valor="nueva" texto="Deshacer" secundario />}
          </div>
        </form>
      )}
      {estado?.error && <ErrorCampo>{estado.error}</ErrorCampo>}
    </Tarjeta>
  );
}

function BotonDecision({ valor, texto, secundario }: { valor: string; texto: string; secundario?: boolean }) {
  return (
    <Boton type="submit" name="decision" value={valor} variante={secundario ? "secundario" : undefined} compacto>
      {texto}
    </Boton>
  );
}

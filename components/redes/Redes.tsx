import type { ReactNode } from "react";
import { Etiqueta, Tarjeta, type Tono } from "@/components/ui";
import { dia } from "@/lib/formato";
import { miles, type Apuesta, type Conclusion, type Reel } from "@/lib/redes";
import s from "./Redes.module.css";

const coma = (x: number, d = 1) => x.toFixed(d).replace(".", ",");
const pct = (x: number | null) => (x === null ? "sin dato" : `${Math.round(x)} %`);

// Número grande con su comparación debajo («un número suelto no dice nada»).
export function Indicador({ valor, texto, comparacion, tono = "neutro" }: { valor: string; texto: string; comparacion?: ReactNode; tono?: Tono }) {
  return (
    <div className={s.indicador} data-tono={tono}>
      <b>{valor}</b>
      <span className={s.nombre}>{texto}</span>
      {comparacion && <span className={s.comparacion}>{comparacion}</span>}
    </div>
  );
}

export function Indicadores({ children }: { children: ReactNode }) {
  return <div className={s.indicadores}>{children}</div>;
}

// Vistas por reel, una barra cada uno (el más nuevo arriba y en naranja). Toca para ir a su ficha.
export function GraficaVistas({ reels }: { reels: Reel[] }) {
  const max = Math.max(1, ...reels.map((r) => r.vistas));
  return (
    <div className={s.grafica} role="list" aria-label="Vistas por reel">
      {reels.map((r, i) => (
        <a
          key={r.permalink}
          href={`#${ancla(r)}`}
          role="listitem"
          className={s.barraFila}
          title={`${r.titulo} · ${dia(r.publicado)} · ${miles(r.vistas)} vistas · salto ${pct(r.salto)}`}
        >
          <span className={s.barraTexto}>
            <span className={s.barraFecha}>{dia(r.publicado)}</span>
            <span className={s.barraTitulo}>{r.ge ? `${r.ge} · ` : ""}{r.titulo}</span>
          </span>
          <span className={s.barraPista}>
            <span className={s.barra} data-nuevo={i === 0 || undefined} style={{ width: `${Math.max(2, (r.vistas / max) * 100)}%` }} />
          </span>
          <span className={s.barraValor}>{miles(r.vistas)}</span>
        </a>
      ))}
    </div>
  );
}

export const ancla = (r: Reel) => `reel-${r.permalink.split("/").filter(Boolean).at(-1)}`;

// Ficha de un reel: números clave y su diagnóstico en frases.
export function TarjetaReel({ r }: { r: Reel }) {
  const malo = r.senales.some((x) => x.tono === "mal");
  return (
    <div id={ancla(r)} className={s.ancla}>
      <Tarjeta tono={malo ? "mal" : r.senales.some((x) => x.tono === "bien") ? "bien" : undefined}>
        <div className={s.reel}>
          {/* Portada del propio Instagram (la URL caduca, pero cada día llega una nueva con la foto).
              De fondo y no <img>: si Instagram no la sirve, queda el hueco gris en vez del icono roto. */}
          <span className={s.portada} style={r.portada ? { backgroundImage: `url("${r.portada}")` } : undefined} aria-hidden />
          <div className={s.reelTextos}>
            <span className="codigo">
              {dia(r.publicado)}
              {r.ge ? ` · ${r.ge}` : ""}
              {r.tema ? ` · ${r.tema}` : ""}
            </span>
            <strong className={s.reelTitulo}>{r.titulo}</strong>
            <span className={s.reelVistas}>
              <b>{miles(r.vistas)}</b> vistas
              {r.vistasSemana !== null && r.vistasSemana > 0 && <span className="suave"> · +{miles(r.vistasSemana)} esta semana</span>}
            </span>
          </div>
        </div>
        <dl className={s.datos}>
          <Dato nombre="Se van al empezar" valor={pct(r.salto)} />
          <Dato nombre="Lo miran de media" valor={r.tiempoMedio === null ? "sin dato" : `${coma(r.tiempoMedio)} s`} />
          {r.pctVisto !== null && <Dato nombre="Visto del vídeo" valor={pct(r.pctVisto)} />}
          <Dato nombre="Personas" valor={miles(r.alcance)} />
          <Dato nombre="Guardados" valor={`${r.guardados}`} />
          <Dato nombre="Compartidos" valor={`${r.compartidos}`} />
        </dl>
        {(r.prueba || r.tipoGancho) && (
          <p className={s.probaba}>
            {r.prueba && (
              <>
                Probaba <b>{r.prueba}</b>
              </>
            )}
            {r.prueba && r.tipoGancho && " · "}
            {r.tipoGancho && <>gancho {r.tipoGancho}</>}
          </p>
        )}
        {!!r.senales.length && (
          <div className={s.senales}>
            {r.senales.map((x) => (
              <Etiqueta key={x.texto} tono={x.tono}>
                {x.texto}
              </Etiqueta>
            ))}
          </div>
        )}
        <a className={s.enlace} href={r.permalink} target="_blank" rel="noreferrer">
          Ver en Instagram
        </a>
      </Tarjeta>
    </div>
  );
}

function Dato({ nombre, valor }: { nombre: string; valor: string }) {
  return (
    <div className={s.dato}>
      <dt>{nombre}</dt>
      <dd>{valor}</dd>
    </div>
  );
}

// Una conclusión: qué dicen los números y qué probar en el próximo guion.
export function TarjetaConclusion({ c }: { c: Conclusion }) {
  return (
    <Tarjeta tono={c.tono}>
      <strong>{c.titulo}</strong>
      <p className="suave">{c.texto}</p>
      {c.prueba && (
        <p className={s.prueba}>
          <b>Prueba:</b> {c.prueba}
        </p>
      )}
    </Tarjeta>
  );
}

// Una apuesta del analista: qué se prueba en los guiones, cómo se mide y qué reels la llevaban.
export function TarjetaApuesta({ a, reels }: { a: Apuesta; reels: Reel[] }) {
  return (
    <Tarjeta tono={a.cerrada ? "neutro" : "info"}>
      <span className="codigo">
        {a.id}
        {a.desde ? ` · desde ${dia(a.desde)}` : ""}
      </span>
      <strong className={s.reelTitulo}>{a.texto}</strong>
      {a.medida && (
        <p className="suave pequeno">
          <b>Funciona si:</b> {a.medida}
        </p>
      )}
      <p className="suave pequeno">
        {reels.length
          ? `La llevan: ${reels.map((r) => r.ge ?? r.titulo).join(", ")}`
          : "Ningún reel publicado la lleva todavía: entra en los próximos guiones."}
      </p>
    </Tarjeta>
  );
}

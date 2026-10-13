import type { Metadata } from "next";
import { Aviso, Desplegable, Pantalla, Seccion, Vacio } from "@/components/ui";
import { GraficaVistas, Indicador, Indicadores, TarjetaConclusion, TarjetaReel } from "@/components/redes/Redes";
import { Guion } from "@/components/videos/Guion";
import { fotosRecientes, infoReels, ultimoInforme } from "@/lib/datos/redes";
import { dia, hoy, plural } from "@/lib/formato";
import { conclusiones, construirReels, miles, resumen } from "@/lib/redes";

export const metadata: Metadata = { title: "Redes" };

const pct = (x: number | null) => (x === null ? "–" : `${Math.round(x)} %`);
const coma = (x: number | null) => (x === null ? "–" : x.toFixed(1).replace(".", ","));

// Cómo van los reels y qué cambiar. Números: foto diaria de Instagram (Windsor).
// Qué es cada reel (GE, tema) y el informe del analista: los sube el PC.
export default async function Redes() {
  const [fotos, info, informe] = await Promise.all([fotosRecientes(), infoReels(), ultimoInforme()]);
  const { reels, foto, diasSemana } = construirReels(fotos, info);
  const hoyISO = hoy();

  if (!foto || !reels.length) {
    return (
      <Pantalla titulo="Redes">
        <Vacio titulo="Todavía no hay datos" texto="Las cifras llegan cada mañana con la foto de Instagram." icono="reloj" tono="neutro" />
      </Pantalla>
    );
  }

  const r = resumen(reels, hoyISO);
  const ideas = conclusiones(reels, hoyISO);
  const vieja = Date.parse(`${hoyISO}T12:00:00Z`) - Date.parse(`${foto}T12:00:00Z`) > 864e5;

  return (
    <Pantalla titulo="Redes" subtitulo={`Instagram · ${plural(reels.length, "reel")} de ELSA · cifras del ${dia(foto)}`}>
      {vieja && (
        <Aviso tono="ojo">
          Las cifras son del {dia(foto)}: la foto diaria de Instagram de hoy no ha llegado todavía.
        </Aviso>
      )}

      <Indicadores>
        <Indicador
          valor={r.vistasSemana === null ? "–" : miles(r.vistasSemana)}
          texto="Vistas esta semana"
          comparacion={diasSemana ? `en ${diasSemana} días, sumando todos los reels` : "falta la foto de hace 7 días"}
          tono="info"
        />
        <Indicador
          valor={`${r.reelsMes}`}
          texto="Reels en 30 días"
          comparacion="objetivo: 8 (2 por semana)"
          tono={r.reelsMes >= 6 ? "bien" : r.reelsMes >= 3 ? "ojo" : "mal"}
        />
        <Indicador
          valor={pct(r.saltoReciente)}
          texto="Se van al empezar"
          comparacion={`últimos 5 · la cuenta: ${pct(r.saltoTotal)}`}
          tono={r.saltoReciente === null || r.saltoTotal === null ? "neutro" : r.saltoReciente <= r.saltoTotal ? "bien" : "ojo"}
        />
        <Indicador
          valor={coma(r.socialReciente)}
          texto="Guardados + compartidos por mil"
          comparacion={`últimos 5 · la cuenta: ${coma(r.socialTotal)}`}
          tono={r.socialReciente === null || r.socialTotal === null ? "neutro" : r.socialReciente >= r.socialTotal ? "bien" : "ojo"}
        />
      </Indicadores>

      <Seccion titulo="Qué cambiar o enfocar">
        {ideas.map((c) => (
          <TarjetaConclusion key={c.titulo} c={c} />
        ))}
        <p className="suave pequeno">
          Sale de {plural(reels.length, "reel")} de los últimos 90 días: son indicios, no reglas. Lo que se repita en 3 vídeos o más, el analista lo
          propone en Aprende.
        </p>
      </Seccion>

      {informe && (
        <Seccion titulo="Informe del analista">
          <Desplegable titulo={`${informe.titulo} · ${dia(informe.fecha)}`}>
            <Guion md={informe.markdown} />
          </Desplegable>
        </Seccion>
      )}

      <Seccion titulo="Vistas por reel">
        <GraficaVistas reels={reels} />
        <p className="suave pequeno">En naranja, el último. Toca uno para ver su ficha.</p>
      </Seccion>

      <Seccion titulo="Reel a reel" cuenta={reels.length}>
        {reels.map((x) => (
          <TarjetaReel key={x.permalink} r={x} />
        ))}
      </Seccion>

      <Desplegable titulo="Cómo leer estos números">
        <p className="suave pequeno">
          <b>Se van al empezar</b>: de cada 100 que empiezan a verlo, cuántos lo pasan en los 3 primeros segundos. Por debajo del 30 % el
          gancho funciona; por encima del 35 %, el primer plano no engancha.
        </p>
        <p className="suave pequeno">
          <b>Lo miran de media</b>: segundos que se queda cada persona. Si sabemos lo que dura el montaje, sale también el % visto.
        </p>
        <p className="suave pequeno">
          <b>Guardados y compartidos por mil vistas</b>: lo que hace que Instagram lo enseñe a más gente. Se comparan por mil para que un reel con
          muchas vistas no gane solo por eso.
        </p>
      </Desplegable>
    </Pantalla>
  );
}

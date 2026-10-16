import type { Metadata } from "next";
import { Aviso, Desplegable, Pantalla, Seccion, Segmentos, Vacio } from "@/components/ui";
import { GraficaVistas, Indicador, Indicadores, TarjetaApuesta, TarjetaConclusion, TarjetaPareja, TarjetaReel } from "@/components/redes/Redes";
import { Guion } from "@/components/videos/Guion";
import { apuestasMd, fotosRecientes, fotosTikTok, infoReels, ultimoInforme } from "@/lib/datos/redes";
import { dia, hoy, plural } from "@/lib/formato";
import {
  comparar,
  conclusiones,
  conclusionesComparar,
  construirReels,
  emparejar,
  infoTikTok,
  leerApuestas,
  miles,
  NOMBRE_RED,
  resumen,
  type Foto,
  type Red,
} from "@/lib/redes";

export const metadata: Metadata = { title: "Redes" };

const pct = (x: number | null) => (x === null ? "–" : `${Math.round(x)} %`);
const coma = (x: number | null) => (x === null ? "–" : x.toFixed(1).replace(".", ","));
const ultima = (fotos: Foto[]) => [...fotos].sort((a, b) => b.fecha.localeCompare(a.fecha))[0]?.reels ?? [];

// Cómo van los reels y qué cambiar. Números: foto diaria de Instagram y de TikTok (Windsor).
// Qué es cada reel (GE, tema) y el informe del analista: los sube el PC. Los vídeos de TikTok
// heredan la ficha de su pareja en Instagram (mismo montaje, publicado casi a la vez).
export default async function Redes({ searchParams }: PageProps<"/redes">) {
  const { red: q } = await searchParams;
  const vista: Red | "las-dos" = q === "tiktok" ? "tiktok" : q === "las-dos" ? "las-dos" : "instagram";
  const [fotosIg, fotosTt, info, informe, md] = await Promise.all([fotosRecientes(), fotosTikTok(), infoReels(), ultimoInforme(), apuestasMd()]);
  const pareja = emparejar(ultima(fotosIg), ultima(fotosTt));
  const ig = construirReels(fotosIg, info, "instagram");
  const tt = construirReels(fotosTt, infoTikTok(pareja, info), "tiktok");
  const hoyISO = hoy();

  const selector = (
    <Segmentos
      opciones={[
        { href: "/redes", texto: "Instagram", activo: vista === "instagram" },
        { href: "/redes?red=tiktok", texto: "TikTok", activo: vista === "tiktok" },
        { href: "/redes?red=las-dos", texto: "Las dos", activo: vista === "las-dos" },
      ]}
    />
  );

  if (vista === "las-dos") {
    const c = comparar(ig.reels, tt.reels, pareja);
    const ideas = conclusionesComparar(c);
    if (!ig.foto || !tt.foto) {
      return (
        <Pantalla titulo="Redes" subtitulo="Instagram frente a TikTok">
          {selector}
          <Vacio titulo="Falta una de las dos" texto="Hacen falta la foto de Instagram y la de TikTok: llegan cada mañana." icono="reloj" tono="neutro" />
        </Pantalla>
      );
    }
    return (
      <Pantalla titulo="Redes" subtitulo={`Instagram frente a TikTok · ${plural(c.parejas.length, "vídeo")} en las dos · cifras del ${dia(tt.foto)}`}>
        {selector}
        <Indicadores>
          <Indicador
            valor={c.ratio === null ? "–" : `×${coma(c.ratio)}`}
            texto="Vistas TikTok ÷ Instagram"
            comparacion={`mediana del mismo vídeo · ${plural(c.maduras, "vídeo")} con 7 días o más`}
            tono="info"
          />
          <Indicador valor={c.vistasIg === null ? "–" : miles(c.vistasIg)} texto="Vistas en Instagram" comparacion="mediana por vídeo" />
          <Indicador valor={c.vistasTt === null ? "–" : miles(c.vistasTt)} texto="Vistas en TikTok" comparacion="mediana por vídeo" />
          <Indicador valor={`${c.seguidoresTt}`} texto="Seguidores nuevos por TikTok" comparacion="lo que han traído los vídeos (90 días)" tono="bien" />
        </Indicadores>

        <Seccion titulo="Qué dicen las dos juntas">
          {ideas.length ? ideas.map((x) => <TarjetaConclusion key={x.titulo} c={x} />) : <p className="suave">Aún hay pocos vídeos en las dos redes.</p>}
          <p className="suave pequeno">
            Se emparejan por la hora de publicación y el texto. Instagram mide «se van en 3 s»; TikTok, «lo ven entero»: no son la misma cifra.
          </p>
        </Seccion>

        <Seccion titulo="Vídeo a vídeo" cuenta={c.parejas.length}>
          {c.parejas.map((p) => (
            <TarjetaPareja key={p.tt.permalink} p={p} />
          ))}
        </Seccion>
      </Pantalla>
    );
  }

  const { reels, foto, diasSemana } = vista === "tiktok" ? tt : ig;
  const nombre = NOMBRE_RED[vista];

  if (!foto || !reels.length) {
    return (
      <Pantalla titulo="Redes">
        {selector}
        <Vacio titulo="Todavía no hay datos" texto={`Las cifras llegan cada mañana con la foto de ${nombre}.`} icono="reloj" tono="neutro" />
      </Pantalla>
    );
  }

  const r = resumen(reels, hoyISO);
  const ideas = conclusiones(reels, hoyISO);
  const apuestas = leerApuestas(md ?? "");
  const abiertas = apuestas.filter((a) => !a.cerrada);
  const cerradas = apuestas.filter((a) => a.cerrada);
  const vieja = Date.parse(`${hoyISO}T12:00:00Z`) - Date.parse(`${foto}T12:00:00Z`) > 864e5;

  return (
    <Pantalla titulo="Redes" subtitulo={`${nombre} · ${plural(reels.length, vista === "tiktok" ? "vídeo" : "reel")} de ELSA · cifras del ${dia(foto)}`}>
      {selector}
      {vieja && (
        <Aviso tono="ojo">
          Las cifras son del {dia(foto)}: la foto diaria de {nombre} de hoy no ha llegado todavía.
        </Aviso>
      )}

      <Indicadores>
        <Indicador
          valor={r.vistasSemana === null ? "–" : miles(r.vistasSemana)}
          texto="Vistas esta semana"
          comparacion={diasSemana ? `en ${diasSemana} días, sumando todos los ${vista === "tiktok" ? "vídeos" : "reels"}` : "falta la foto de hace 7 días"}
          tono="info"
        />
        <Indicador
          valor={`${r.reelsMes}`}
          texto={vista === "tiktok" ? "Vídeos en 30 días" : "Reels en 30 días"}
          comparacion="objetivo: 8 (2 por semana)"
          tono={r.reelsMes >= 6 ? "bien" : r.reelsMes >= 3 ? "ojo" : "mal"}
        />
        {vista === "tiktok" ? (
          <Indicador
            valor={pct(r.completoReciente)}
            texto="Lo ven entero"
            comparacion={`últimos 5 · la cuenta: ${pct(r.completoTotal)}`}
            tono={r.completoReciente === null || r.completoTotal === null ? "neutro" : r.completoReciente >= r.completoTotal ? "bien" : "ojo"}
          />
        ) : (
          <Indicador
            valor={pct(r.saltoReciente)}
            texto="Se van al empezar"
            comparacion={`últimos 5 · la cuenta: ${pct(r.saltoTotal)}`}
            tono={r.saltoReciente === null || r.saltoTotal === null ? "neutro" : r.saltoReciente <= r.saltoTotal ? "bien" : "ojo"}
          />
        )}
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
          Sale de {plural(reels.length, vista === "tiktok" ? "vídeo" : "reel")} de los últimos 90 días: son indicios, no reglas. Lo que se repita en 3
          vídeos o más, el analista lo propone en Aprende.
        </p>
      </Seccion>

      <Seccion titulo="Lo que se está probando" cuenta={abiertas.length}>
        {abiertas.length ? (
          abiertas.map((a) => <TarjetaApuesta key={a.id} a={a} reels={reels.filter((r) => r.prueba === a.id)} />)
        ) : (
          <Vacio titulo="Nada en prueba" texto="El analista abre apuestas los lunes con lo que ve en los números." icono="reloj" tono="neutro" />
        )}
        <p className="suave pequeno">
          El guionista aplica una en cada guion y la apunta. A los 7 días de publicar, el analista mira si se cumplió; si funciona en 3 vídeos, te
          la propone como regla en Aprende.
        </p>
        {!!cerradas.length && (
          <Desplegable titulo={`Cerradas (${cerradas.length})`}>
            {cerradas.map((a) => (
              <p key={a.id} className="suave pequeno">
                <b>{a.id}</b> · {a.texto}
              </p>
            ))}
          </Desplegable>
        )}
      </Seccion>

      {informe && (
        <Seccion titulo="Informe del analista">
          <Desplegable titulo={`${informe.titulo} · ${dia(informe.fecha)}`}>
            <Guion md={informe.markdown} />
          </Desplegable>
        </Seccion>
      )}

      <Seccion titulo={vista === "tiktok" ? "Vistas por vídeo" : "Vistas por reel"}>
        <GraficaVistas reels={reels} />
        <p className="suave pequeno">En naranja, el último. Toca uno para ver su ficha.</p>
      </Seccion>

      <Seccion titulo={vista === "tiktok" ? "Vídeo a vídeo" : "Reel a reel"} cuenta={reels.length}>
        {reels.map((x) => (
          <TarjetaReel key={x.permalink} r={x} />
        ))}
      </Seccion>

      <Desplegable titulo="Cómo leer estos números">
        {vista === "tiktok" ? (
          <p className="suave pequeno">
            <b>Lo ven entero</b>: de cada 100 que lo empiezan, cuántos llegan al final. TikTok no da el «se van en 3 s» de Instagram; esta es su
            mejor señal de que el vídeo engancha. Los vídeos cortos lo tienen más fácil.
          </p>
        ) : (
          <p className="suave pequeno">
            <b>Se van al empezar</b>: de cada 100 que empiezan a verlo, cuántos lo pasan en los 3 primeros segundos. Por debajo del 30 % el
            gancho funciona; por encima del 35 %, el primer plano no engancha.
          </p>
        )}
        <p className="suave pequeno">
          <b>Lo miran de media</b>: segundos que se queda cada persona. Si sabemos lo que dura el montaje, sale también el % visto.
        </p>
        <p className="suave pequeno">
          <b>Guardados y compartidos por mil vistas</b>: lo que hace que {nombre} lo enseñe a más gente. Se comparan por mil para que un vídeo con
          muchas vistas no gane solo por eso.
          {vista === "tiktok" && " En TikTok, «guardados» son los favoritos."}
        </p>
      </Desplegable>
    </Pantalla>
  );
}

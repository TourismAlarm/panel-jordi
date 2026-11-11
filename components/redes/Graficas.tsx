import { dia } from "@/lib/formato";
import { mediana, miles, type Reel } from "@/lib/redes";
import { ancla } from "./Redes";

// Gráficas de Redes en SVG puro. Una sola serie cada una: el color del módulo marca el último vídeo, el resto va en gris.
// Los textos van siempre en los colores de texto, nunca en el de la serie.
const COLOR = "var(--mod-elsa)";
const GRIS = "color-mix(in srgb, var(--texto-suave) 45%, var(--superficie))";
const CUANTOS = 14;
const pct = (x: number) => `${Math.round(x)} %`;

const caja = "flex flex-col gap-2 rounded-lg border border-border bg-card p-4";

// Vistas de cada vídeo por orden de publicación (el más nuevo, a la derecha y en color), con la mediana de la cuenta
// como referencia. Responde a «¿vamos a más o a menos?». Tocar una barra lleva a la ficha de ese vídeo.
export function ColumnasVistas({ reels, medianaVistas }: { reels: Reel[]; medianaVistas: number | null }) {
  const lista = [...reels].sort((a, b) => a.publicado.localeCompare(b.publicado)).slice(-CUANTOS);
  if (lista.length < 2) return null;
  const W = 320;
  const H = 150;
  const ARRIBA = 18;
  const BASE = H - 18;
  const max = Math.max(1, ...lista.map((r) => r.vistas), medianaVistas ?? 0);
  const paso = W / lista.length;
  const ancho = Math.min(22, paso - 2);
  const y = (v: number) => BASE - (v / max) * (BASE - ARRIBA);
  const mejor = lista.reduce((a, r) => (r.vistas > a.vistas ? r : a));
  const ultimo = lista[lista.length - 1];
  const yMed = medianaVistas === null ? null : y(medianaVistas);

  return (
    <figure className={caja} style={{ margin: 0 }}>
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="font-semibold">Vistas, vídeo a vídeo</span>
        <span className="text-sm text-muted-foreground">últimos {lista.length}</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Vistas de los últimos ${lista.length} vídeos por orden de publicación`}>
        <line x1="0" x2={W} y1={BASE} y2={BASE} stroke="var(--borde)" strokeWidth="1" />
        {lista.map((r, i) => {
          const x = i * paso + (paso - ancho) / 2;
          const alto = Math.max(2, BASE - y(r.vistas));
          const esUltimo = r === ultimo;
          return (
            <a key={r.permalink} href={`#${ancla(r)}`}>
              <title>{`${r.titulo} · ${dia(r.publicado)} · ${miles(r.vistas)} vistas`}</title>
              {/* zona de toque más grande que la barra */}
              <rect x={i * paso} y={ARRIBA} width={paso} height={BASE - ARRIBA} fill="transparent" />
              <path d={`M${x},${BASE} v${-(alto - 3)} q0,-3 3,-3 h${ancho - 6} q3,0 3,3 v${alto - 3} z`} fill={esUltimo ? COLOR : GRIS} />
              {(r === mejor || esUltimo) && (
                <text x={Math.min(W - 16, Math.max(16, x + ancho / 2))} y={BASE - alto - 5} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--texto)">
                  {miles(r.vistas)}
                </text>
              )}
            </a>
          );
        })}
        {yMed !== null && <line x1="0" x2={W} y1={yMed} y2={yMed} stroke="var(--texto)" strokeWidth="1.5" strokeDasharray="4 4" />}
        <text x="0" y={H - 3} fontSize="11" fill="var(--texto-suave)">{dia(lista[0].publicado)}</text>
        <text x={W} y={H - 3} fontSize="11" textAnchor="end" fill="var(--texto-suave)">{dia(ultimo.publicado)}</text>
      </svg>
      <p className="text-sm text-muted-foreground">
        <span className="mr-1 inline-block size-2.5 rounded-sm align-baseline" style={{ background: COLOR }} />
        El último{ultimo.edad < 7 ? " (aún sube)" : ""}
        {medianaVistas !== null && <> · línea de puntos: lo normal de la cuenta, {miles(medianaVistas)}</>}
      </p>
    </figure>
  );
}

// El gancho, vídeo a vídeo. Instagram: % que se va en los 3 primeros segundos (menos es mejor; por debajo del 30 % funciona).
// TikTok: % que lo ve entero (más es mejor), contra lo normal de la cuenta.
export function LineaGancho({ reels, red }: { reels: Reel[]; red: "instagram" | "tiktok" }) {
  const campo = red === "tiktok" ? "completo" : "salto";
  const lista = [...reels].filter((r) => r[campo] !== null).sort((a, b) => a.publicado.localeCompare(b.publicado)).slice(-CUANTOS);
  if (lista.length < 3) return null;
  const valores = lista.map((r) => r[campo] as number);
  const ref = red === "tiktok" ? mediana(valores) : 30;
  const W = 320;
  const H = 140;
  const ARRIBA = 18;
  const BASE = H - 20;
  const todos = ref === null ? valores : [...valores, ref];
  const min = Math.max(0, Math.min(...todos) - 5);
  const max = Math.max(...todos) + 5;
  const x = (i: number) => 8 + (i / (lista.length - 1)) * (W - 16);
  const y = (v: number) => BASE - ((v - min) / (max - min)) * (BASE - ARRIBA);
  const ultimo = valores[valores.length - 1];
  const bien = ref === null ? null : red === "tiktok" ? ultimo >= ref : ultimo <= ref;
  const yRef = ref === null ? null : y(ref);

  return (
    <figure className={caja} style={{ margin: 0 }}>
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="font-semibold">{red === "tiktok" ? "Lo ven entero" : "Se van al empezar"}</span>
        <span className="text-sm text-muted-foreground">{red === "tiktok" ? "más es mejor" : "menos es mejor"}</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${red === "tiktok" ? "Porcentaje que lo ve entero" : "Porcentaje que se va al empezar"}, últimos ${lista.length} vídeos`}>
        {yRef !== null && (
          <>
            {/* la zona buena, apenas tintada */}
            <rect x="0" width={W} y={red === "tiktok" ? ARRIBA - 8 : yRef} height={red === "tiktok" ? yRef - ARRIBA + 8 : BASE - yRef + 8} fill="var(--bien)" opacity="0.08" />
            <line x1="0" x2={W} y1={yRef} y2={yRef} stroke="var(--texto)" strokeWidth="1.5" strokeDasharray="4 4" />
            <text x={W / 2} y={yRef - 5} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--texto-suave)" stroke="var(--superficie)" strokeWidth="4" paintOrder="stroke">{pct(ref!)}</text>
          </>
        )}
        <polyline points={valores.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")} fill="none" stroke={GRIS} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {lista.map((r, i) => {
          const esUltimo = i === lista.length - 1;
          return (
            <a key={r.permalink} href={`#${ancla(r)}`}>
              <title>{`${r.titulo} · ${dia(r.publicado)} · ${pct(valores[i])}`}</title>
              <circle cx={x(i)} cy={y(valores[i])} r="12" fill="transparent" />
              <circle cx={x(i)} cy={y(valores[i])} r={esUltimo ? 5.5 : 4} fill={esUltimo ? COLOR : GRIS} stroke="var(--superficie)" strokeWidth="2" />
            </a>
          );
        })}
        <text x={x(lista.length - 1)} y={y(ultimo) - 11} textAnchor="end" fontSize="12" fontWeight="700" fill="var(--texto)" stroke="var(--superficie)" strokeWidth="4" paintOrder="stroke">{pct(ultimo)}</text>
        <text x="0" y={H - 3} fontSize="11" fill="var(--texto-suave)">{dia(lista[0].publicado)}</text>
        <text x={W} y={H - 3} fontSize="11" textAnchor="end" fill="var(--texto-suave)">{dia(lista[lista.length - 1].publicado)}</text>
      </svg>
      <p className="text-sm text-muted-foreground">
        {red === "tiktok" ? "Línea de puntos: lo normal de la cuenta. Por encima, el vídeo engancha." : "Por debajo del 30 % (zona verde) el gancho funciona."}
        {bien !== null && <> El último: <b className="text-foreground">{bien ? "bien" : "flojo"}</b>.</>}
      </p>
    </figure>
  );
}

// Dos barras finas para comparar dos cifras: por defecto, los últimos 5 contra toda la cuenta. Va dentro de un Indicador.
export function Comparado({ reciente, total, formato, nombres = ["Últimos 5", "La cuenta"] }: { reciente: number | null; total: number | null; formato: (v: number) => string; nombres?: [string, string] }) {
  if (reciente === null || total === null) return null;
  const max = Math.max(reciente, total, 0.0001);
  const fila = (nombre: string, v: number, color: string) => (
    <div className="grid grid-cols-[4.2rem_1fr_auto] items-center gap-2 text-xs">
      <span className="text-muted-foreground">{nombre}</span>
      <span className="h-2 overflow-hidden rounded-full bg-muted">
        <span className="block h-full rounded-full" style={{ width: `${Math.max(3, (v / max) * 100)}%`, background: color }} />
      </span>
      <span className="font-semibold tabular-nums">{formato(v)}</span>
    </div>
  );
  return (
    <div className="mt-1.5 flex flex-col gap-1">
      {fila(nombres[0], reciente, COLOR)}
      {fila(nombres[1], total, GRIS)}
    </div>
  );
}

// Barra hacia un objetivo: «5 de 8».
export function Meta({ valor, objetivo }: { valor: number; objetivo: number }) {
  return (
    <div className="mt-1.5 flex gap-1" role="img" aria-label={`${valor} de ${objetivo}`}>
      {Array.from({ length: objetivo }, (_, i) => (
        <span key={i} className="h-2 flex-1 rounded-full" style={{ background: i < valor ? COLOR : "var(--superficie-2)" }} />
      ))}
    </div>
  );
}

// En la ficha de un vídeo: cada medida como una barra, con una raya donde cae lo normal de la cuenta.
// `sinJuzgar`: la barra va en gris (un vídeo recién publicado aún no se puede comparar).
export function Medidor({ nombre, texto, valor, normal, max, mejor, sinJuzgar }: { nombre: string; texto: string; valor: number | null; normal: number | null; max: number; mejor: "alto" | "bajo"; sinJuzgar?: boolean }) {
  if (valor === null) return null;
  const parte = (v: number) => `${Math.min(100, Math.max(0, (v / Math.max(max, 0.0001)) * 100))}%`;
  const bien = normal === null || sinJuzgar ? null : mejor === "alto" ? valor >= normal : valor <= normal;
  return (
    <div className="grid grid-cols-[1fr_auto] items-baseline gap-x-2 gap-y-1 text-sm">
      <span className="text-muted-foreground">{nombre}</span>
      <span className="font-bold tabular-nums">{texto}</span>
      <span className="relative col-span-2 h-2.5 rounded-full bg-muted">
        <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: parte(valor), background: bien === null ? GRIS : bien ? "var(--bien)" : "var(--ojo)" }} />
        {normal !== null && <span className="absolute -inset-y-1 w-0.5 rounded-full bg-foreground" style={{ left: parte(normal) }} title="Lo normal de la cuenta" />}
      </span>
    </div>
  );
}

// El mismo vídeo en las dos redes: una barra por vídeo, hacia arriba si tuvo más vistas en TikTok y hacia abajo si en Instagram.
// La altura es cuántas veces más (×2, ×4…), en escala de dobles para que un vídeo disparado no aplaste al resto.
export function GanaPorVideo({ parejas }: { parejas: { titulo: string; publicado: string; ig: Reel; tt: Reel }[] }) {
  const lista = [...parejas].filter((p) => p.ig.vistas > 0 && p.tt.vistas > 0).sort((a, b) => a.publicado.localeCompare(b.publicado)).slice(-CUANTOS);
  if (lista.length < 2) return null;
  const veces = lista.map((p) => p.tt.vistas / p.ig.vistas);
  const dobles = veces.map((v) => Math.log2(v));
  const tope = Math.max(1, ...dobles.map(Math.abs));
  const W = 320;
  const H = 170;
  const MEDIO = H / 2;
  const ALTO = MEDIO - 26;
  const paso = W / lista.length;
  const ancho = Math.min(22, paso - 2);
  const texto = (v: number) => `×${(v >= 1 ? v : 1 / v).toFixed(1).replace(".", ",")}`;
  const extremo = dobles.reduce((a, d, i) => (Math.abs(d) > Math.abs(dobles[a]) ? i : a), 0);
  const ganaTt = veces.filter((v) => v > 1).length;

  return (
    <figure className={caja} style={{ margin: 0 }}>
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="font-semibold">Dónde funcionó mejor cada vídeo</span>
        <span className="text-sm text-muted-foreground">últimos {lista.length}</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Vistas en TikTok frente a Instagram en los últimos ${lista.length} vídeos: TikTok gana en ${ganaTt}`}>
        <text x="0" y="11" fontSize="11" fontWeight="600" fill="var(--texto-suave)">↑ más vistas en TikTok</text>
        <text x="0" y={H - 16} fontSize="11" fontWeight="600" fill="var(--texto-suave)">↓ más vistas en Instagram</text>
        {lista.map((p, i) => {
          const x = i * paso + (paso - ancho) / 2;
          const alto = Math.max(3, (Math.abs(dobles[i]) / tope) * ALTO);
          const arriba = dobles[i] >= 0;
          return (
            <a key={p.tt.permalink} href={p.tt.permalink} target="_blank" rel="noreferrer">
              <title>{`${p.titulo} · ${dia(p.publicado)} · TikTok ${miles(p.tt.vistas)} · Instagram ${miles(p.ig.vistas)}`}</title>
              <rect x={i * paso} y="16" width={paso} height={H - 36} fill="transparent" />
              <rect x={x} y={arriba ? MEDIO - 1 - alto : MEDIO + 1} width={ancho} height={alto} rx="3" fill={arriba ? COLOR : GRIS} />
              {i === extremo && (
                <text x={Math.min(W - 14, Math.max(14, x + ancho / 2))} y={arriba ? MEDIO - alto - 6 : MEDIO + alto + 14} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--texto)">
                  {texto(veces[i])}
                </text>
              )}
            </a>
          );
        })}
        <line x1="0" x2={W} y1={MEDIO} y2={MEDIO} stroke="var(--texto)" strokeWidth="1.5" />
        <text x="0" y={H - 3} fontSize="11" fill="var(--texto-suave)">{dia(lista[0].publicado)}</text>
        <text x={W} y={H - 3} fontSize="11" textAnchor="end" fill="var(--texto-suave)">{dia(lista[lista.length - 1].publicado)}</text>
      </svg>
      <p className="text-sm text-muted-foreground">
        TikTok gana en <b className="text-foreground">{ganaTt} de {lista.length}</b>. La línea del centro es «igual en las dos». Los vídeos de menos de 7 días aún se mueven.
      </p>
    </figure>
  );
}

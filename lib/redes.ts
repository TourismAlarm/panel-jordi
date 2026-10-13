// Redes: de las fotos diarias de Instagram (Windsor) a «cómo van los reels y qué cambiar».
// Todo es cálculo puro (sin Supabase) para poder probarlo: lib/redes.test.ts.
// Las fotos son acumuladas: cada día trae las cifras totales de cada reel hasta ese día.
import type { Tono } from "@/components/ui";

// Una fila de Windsor tal cual (conector instagram).
export type ReelWindsor = {
  timestamp: string;
  media_permalink: string;
  media_caption?: string | null;
  media_views?: number | null;
  media_reach?: number | null;
  media_reel_avg_watch_time?: number | null; // ms
  media_reel_skip_rate?: number | null; // 0-1: se van en los 3 primeros segundos
  media_saved?: number | null;
  media_shares?: number | null;
  media_product_type?: string | null;
  media_thumbnail_url?: string | null;
};

export type Foto = { fecha: string; reels: ReelWindsor[] };

// Lo que el PC sabe de cada reel (registro.csv + estado del vídeo).
export type InfoReel = {
  permalink: string;
  ge: string | null;
  tema: string | null;
  gancho: string | null;
  duracion_s: number | null;
  elsa: boolean;
};

export type Senal = { tono: Tono; texto: string };

export type Reel = {
  permalink: string;
  publicado: string; // AAAA-MM-DD
  edad: number; // días desde que se publicó hasta la foto
  titulo: string;
  ge: string | null;
  tema: string | null;
  portada: string | null;
  vistas: number;
  alcance: number;
  salto: number | null; // % que se va en los 3 primeros segundos
  tiempoMedio: number | null; // segundos
  pctVisto: number | null; // tiempo medio ÷ duración del montaje (solo si sabemos la duración)
  guardados: number;
  compartidos: number;
  guardadosMil: number;
  compartidosMil: number;
  vistasSemana: number | null; // vistas ganadas desde la foto de hace ~7 días
  senales: Senal[];
};

export type Referencia = { vistas: number | null; salto: number | null; tiempoMedio: number | null; socialMil: number | null };

export type Conclusion = { tono: Tono; titulo: string; texto: string; prueba?: string };

const DIA = 864e5;
const n = (x: number | null | undefined) => (typeof x === "number" && Number.isFinite(x) ? x : 0);
const fechaDe = (ts: string) => new Date(ts.replace(/([+-]\d\d)(\d\d)$/, "$1:$2"));
const dias = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / DIA);

export function mediana(xs: (number | null)[]): number | null {
  const v = xs.filter((x): x is number => typeof x === "number" && Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

// Primera línea del texto del reel, sin emojis ni espacios sobrantes.
export function tituloDe(caption: string | null | undefined, gancho: string | null) {
  const linea = (caption ?? "").split("\n").map((l) => l.trim()).find(Boolean) ?? "";
  const limpia = linea.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "").replace(/\s+/g, " ").trim();
  const t = limpia || gancho || "Reel sin texto";
  return t.length > 70 ? `${t.slice(0, 68).trimEnd()}…` : t;
}

// La foto más cercana a «hace 7 días» (entre 5 y 9 días antes de la última), para las vistas de la semana.
function fotoAnterior(fotos: Foto[], ultima: Foto) {
  return fotos
    .map((f) => ({ f, d: dias(f.fecha, ultima.fecha) }))
    .filter(({ d }) => d >= 5 && d <= 9)
    .sort((a, b) => Math.abs(a.d - 7) - Math.abs(b.d - 7))[0]?.f;
}

// Reels de ELSA de la última foto, con sus números ya calculados. Más nuevo primero.
export function construirReels(fotos: Foto[], info: InfoReel[]): { reels: Reel[]; foto: string | null; diasSemana: number | null } {
  const ordenadas = [...fotos].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const ultima = ordenadas[0];
  if (!ultima) return { reels: [], foto: null, diasSemana: null };
  const anterior = fotoAnterior(ordenadas, ultima);
  const antes = new Map((anterior?.reels ?? []).map((r) => [r.media_permalink, r]));
  const porUrl = new Map(info.map((i) => [i.permalink, i]));

  const reels = ultima.reels
    .filter((r) => (r.media_product_type ?? "REELS") === "REELS" && porUrl.get(r.media_permalink)?.elsa !== false)
    .map((r): Reel => {
      const i = porUrl.get(r.media_permalink);
      const publicado = fechaDe(r.timestamp).toISOString().slice(0, 10);
      const vistas = n(r.media_views);
      const tiempoMedio = typeof r.media_reel_avg_watch_time === "number" ? r.media_reel_avg_watch_time / 1000 : null;
      const previo = antes.get(r.media_permalink);
      const reel: Reel = {
        permalink: r.media_permalink,
        publicado,
        edad: Math.max(0, dias(publicado, ultima.fecha)),
        titulo: tituloDe(r.media_caption, i?.gancho ?? null),
        ge: i?.ge ?? null,
        tema: i?.tema ?? null,
        portada: r.media_thumbnail_url ?? null,
        vistas,
        alcance: n(r.media_reach),
        salto: typeof r.media_reel_skip_rate === "number" ? r.media_reel_skip_rate * 100 : null,
        tiempoMedio,
        pctVisto: tiempoMedio !== null && i?.duracion_s ? Math.min(100, (tiempoMedio / i.duracion_s) * 100) : null,
        guardados: n(r.media_saved),
        compartidos: n(r.media_shares),
        guardadosMil: vistas ? (n(r.media_saved) / vistas) * 1000 : 0,
        compartidosMil: vistas ? (n(r.media_shares) / vistas) * 1000 : 0,
        vistasSemana: anterior ? vistas - n(previo?.media_views) : null,
        senales: [],
      };
      return reel;
    })
    .sort((a, b) => b.publicado.localeCompare(a.publicado));

  const ref = referencia(reels);
  for (const r of reels) r.senales = senales(r, ref);
  return { reels, foto: ultima.fecha, diasSemana: anterior ? dias(anterior.fecha, ultima.fecha) : null };
}

// Lo «normal» de la cuenta: medianas. Las vistas solo de reels con 7 días o más (los nuevos aún suben).
export function referencia(reels: Reel[]): Referencia {
  return {
    vistas: mediana(reels.filter((r) => r.edad >= 7).map((r) => r.vistas)),
    salto: mediana(reels.map((r) => r.salto)),
    tiempoMedio: mediana(reels.map((r) => r.tiempoMedio)),
    socialMil: mediana(reels.map((r) => r.guardadosMil + r.compartidosMil)),
  };
}

const pct = (x: number) => `${Math.round(x)} %`;

// Diagnóstico de un reel en frases cortas: gancho, retención, si se guarda/comparte.
export function senales(r: Reel, ref: Referencia): Senal[] {
  const s: Senal[] = [];
  if (r.edad < 2) s.push({ tono: "info", texto: "Recién publicado: júzgalo a las 48 h" });
  if (r.salto !== null) {
    if (r.salto <= 28) s.push({ tono: "bien", texto: `Gancho fuerte: solo se va el ${pct(r.salto)}` });
    else if (r.salto > 35) s.push({ tono: "mal", texto: `Gancho flojo: se va el ${pct(r.salto)} al empezar` });
    else s.push({ tono: "neutro", texto: `Gancho normal: se va el ${pct(r.salto)}` });
  }
  if (r.pctVisto !== null) {
    if (r.pctVisto >= 50) s.push({ tono: "bien", texto: `Lo ven casi entero (${pct(r.pctVisto)})` });
    else if (r.pctVisto < 35) s.push({ tono: "ojo", texto: `Lo dejan a medias (${pct(r.pctVisto)} visto)` });
  } else if (r.tiempoMedio !== null && ref.tiempoMedio) {
    if (r.tiempoMedio >= ref.tiempoMedio * 1.25) s.push({ tono: "bien", texto: "Engancha: lo miran más que la media" });
    else if (r.tiempoMedio <= ref.tiempoMedio * 0.75) s.push({ tono: "ojo", texto: "Se cae pronto: lo miran menos que la media" });
  }
  const social = r.guardadosMil + r.compartidosMil;
  if (r.vistas >= 1000 && r.edad >= 2) { // con menos vistas, 1 guardado más o menos lo cambia todo
    if (r.compartidosMil >= 2) s.push({ tono: "bien", texto: "Se comparte mucho" });
    else if (ref.socialMil && social >= ref.socialMil * 1.5) s.push({ tono: "bien", texto: "Se guarda y se comparte más que la media" });
    else if (social < 1) s.push({ tono: "ojo", texto: "Casi nadie lo guarda ni lo comparte" });
  }
  return s;
}

const miles = (x: number) => Math.round(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// Lo que dicen los números en conjunto, en frases para decidir el próximo guion.
// Con pocos reels son indicios: se dice cuántos hay detrás de cada frase.
export function conclusiones(reels: Reel[], hoyISO: string): Conclusion[] {
  const out: Conclusion[] = [];
  const maduros = reels.filter((r) => r.edad >= 7);

  // 1 · Ritmo de publicación (objetivo: 2 por semana)
  const ultimos30 = reels.filter((r) => dias(r.publicado, hoyISO) <= 30).length;
  const ultimo = reels[0];
  if (ultimo) {
    const hace = dias(ultimo.publicado, hoyISO);
    out.push({
      tono: ultimos30 >= 6 ? "bien" : ultimos30 >= 3 ? "ojo" : "mal",
      titulo: `${ultimos30} reels en 30 días (objetivo 8)`,
      texto: `El último salió hace ${hace === 0 ? "menos de un día" : `${hace} ${hace === 1 ? "día" : "días"}`}. Instagram reparte más a las cuentas que publican seguido: el ritmo pesa tanto como cada vídeo.`,
      prueba: ultimos30 < 6 ? "Publica en cuanto apruebes un final: no esperes a tener dos." : undefined,
    });
  }

  // 2 · El gancho (salto en los 3 primeros segundos) frente a las vistas
  const buenos = maduros.filter((r) => r.salto !== null && r.salto < 30);
  const flojos = maduros.filter((r) => r.salto !== null && r.salto >= 30);
  const vb = mediana(buenos.map((r) => r.vistas));
  const vf = mediana(flojos.map((r) => r.vistas));
  if (buenos.length >= 2 && flojos.length >= 2 && vb && vf) {
    const x = vb / vf;
    out.push({
      tono: x >= 1.3 ? "bien" : "neutro",
      titulo: x >= 1.3 ? `Buen gancho = ${x.toFixed(1).replace(".", ",")} veces más vistas` : "El gancho no lo explica todo",
      texto: `Con menos del 30 % de salto (${buenos.length} reels) tienen ${miles(vb)} vistas de mediana; con más (${flojos.length}), ${miles(vf)}.`,
      prueba: x >= 1.3 ? "Primer segundo: el problema y la cifra (kilos, metros, «no cabe»). Nada de logo ni plano general lento." : undefined,
    });
  }

  // 3 · Temas que tiran (solo los que el PC tiene clasificados, con 2 o más reels)
  const porTema = new Map<string, Reel[]>();
  for (const r of maduros) if (r.tema) porTema.set(r.tema, [...(porTema.get(r.tema) ?? []), r]);
  const temas = [...porTema.entries()]
    .filter(([, rs]) => rs.length >= 2)
    .map(([tema, rs]) => ({ tema, n: rs.length, vistas: mediana(rs.map((r) => r.vistas)) ?? 0, salto: mediana(rs.map((r) => r.salto)) }))
    .sort((a, b) => b.vistas - a.vistas);
  if (temas.length >= 2) {
    const [mejor, peor] = [temas[0], temas.at(-1)!];
    out.push({
      tono: "info",
      titulo: `Lo que más tira: ${mejor.tema}`,
      texto: `${miles(mejor.vistas)} vistas de mediana (${mejor.n} reels) frente a ${miles(peor.vistas)} de ${peor.tema} (${peor.n}).`,
      prueba: `Cuando haya dos trabajos posibles en la semana, prioriza ${mejor.tema}.`,
    });
  }

  // 4 · Guardados y compartidos: lo que hace que el reel viaje
  const conVistas = maduros.filter((r) => r.vistas >= 1000);
  const top = [...conVistas].sort((a, b) => b.compartidosMil - a.compartidosMil)[0];
  const medComp = mediana(conVistas.map((r) => r.compartidosMil));
  if (top && medComp !== null && top.compartidos >= 3) {
    out.push({
      tono: "info",
      titulo: "Lo que se comparte",
      texto: `«${top.titulo}» tiene ${top.compartidos} compartidos (${top.compartidosMil.toFixed(1).replace(".", ",")} por mil vistas); la mediana es ${medComp.toFixed(1).replace(".", ",")}.`,
      prueba: "Cierra con algo que dé ganas de enseñarlo a otro: la cifra final, el «lo hemos conseguido» o una pregunta al gremio.",
    });
  }

  // 5 · El último reel frente a lo normal (si ya tiene 2 días)
  if (ultimo && ultimo.edad >= 2 && ultimo.salto !== null) {
    const ref = mediana(reels.map((r) => r.salto));
    if (ref !== null) {
      const dif = ultimo.salto - ref;
      out.push({
        tono: dif <= -2 ? "bien" : dif >= 2 ? "ojo" : "neutro",
        titulo: `El último: gancho ${dif <= -2 ? "mejor que" : dif >= 2 ? "peor que" : "igual que"} la media`,
        texto: `«${ultimo.titulo}»: se va el ${pct(ultimo.salto)} al empezar (mediana de la cuenta: ${pct(ref)}).`,
      });
    }
  }
  return out;
}

// Cifras de cabecera: vistas de la semana, reels del mes, gancho mediano reciente vs. histórico.
export function resumen(reels: Reel[], hoyISO: string) {
  const conSemana = reels.filter((r) => r.vistasSemana !== null);
  const recientes = reels.slice(0, 5);
  return {
    vistasSemana: conSemana.length ? conSemana.reduce((a, r) => a + (r.vistasSemana ?? 0), 0) : null,
    reelsMes: reels.filter((r) => dias(r.publicado, hoyISO) <= 30).length,
    saltoReciente: mediana(recientes.map((r) => r.salto)),
    saltoTotal: mediana(reels.map((r) => r.salto)),
    socialReciente: mediana(recientes.map((r) => r.guardadosMil + r.compartidosMil)),
    socialTotal: mediana(reels.map((r) => r.guardadosMil + r.compartidosMil)),
  };
}

export { miles };

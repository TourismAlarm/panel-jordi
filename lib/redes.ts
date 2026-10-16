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
  // Solo TikTok (los rellena deTikTok): Instagram no los da.
  duracion_s?: number | null;
  visto_entero?: number | null; // 0-1: lo ven hasta el final
  seguidores_nuevos?: number | null;
};

export type Red = "instagram" | "tiktok";
export const NOMBRE_RED: Record<Red, string> = { instagram: "Instagram", tiktok: "TikTok" };

// Una fila de Windsor tal cual (conector tiktok_organic).
export type VideoTikTok = {
  video_id: string;
  video_create_datetime: string; // UTC sin zona: 2026-10-15T19:30:33
  video_caption?: string | null;
  video_share_url?: string | null;
  video_views_count?: number | null;
  video_reach?: number | null;
  video_average_time_watched?: number | null; // segundos
  video_full_watched_rate?: number | null; // 0-1
  video_favorites?: number | null;
  video_shares?: number | null;
  video_likes?: number | null;
  video_comments?: number | null;
  video_duration?: number | null; // segundos
  video_new_followers?: number | null;
  video_thumbnail_url?: string | null;
};

// TikTok a la forma de Instagram, para que todo lo demás (reels, señales, conclusiones) sirva igual.
// TikTok no da el «se van en 3 s»; a cambio da cuántos lo ven entero y la duración real.
export function deTikTok(v: VideoTikTok): ReelWindsor {
  const ts = v.video_create_datetime;
  return {
    timestamp: /[zZ]|[+-]\d\d:?\d\d$/.test(ts) ? ts : `${ts}Z`,
    media_permalink: (v.video_share_url ?? "").split("?")[0] || `https://www.tiktok.com/video/${v.video_id}`,
    media_caption: v.video_caption ?? null,
    media_views: v.video_views_count ?? null,
    media_reach: v.video_reach ?? null,
    media_reel_avg_watch_time: typeof v.video_average_time_watched === "number" ? v.video_average_time_watched * 1000 : null,
    media_reel_skip_rate: null,
    media_saved: v.video_favorites ?? null,
    media_shares: v.video_shares ?? null,
    media_product_type: "REELS",
    media_thumbnail_url: v.video_thumbnail_url ?? null,
    duracion_s: v.video_duration ?? null,
    visto_entero: v.video_full_watched_rate ?? null,
    seguidores_nuevos: v.video_new_followers ?? null,
  };
}

// Normaliza un texto para compararlo: minúsculas, sin acentos, emojis, hashtags ni signos.
function palabras(t: string | null | undefined) {
  const limpio = (t ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/#\S+|@\S+/g, " ")
    .replace(/[^a-z0-9ñ\s]/g, " ");
  return new Set(limpio.split(/\s+/).filter((w) => w.length > 2).slice(0, 25));
}

export function parecidoTexto(a: string | null | undefined, b: string | null | undefined) {
  const x = palabras(a), y = palabras(b);
  if (!x.size || !y.size) return 0;
  let comun = 0;
  for (const w of x) if (y.has(w)) comun++;
  return (2 * comun) / (x.size + y.size);
}

// Qué vídeo de TikTok es qué reel de Instagram: Jordi sube el mismo montaje a las dos casi a la vez,
// a veces con otro texto. Cuenta la hora (≤ 3 h) y el parecido del texto (máx. 3 días de diferencia).
// Devuelve {permalink TikTok → permalink Instagram}.
export function emparejar(ig: ReelWindsor[], tt: ReelWindsor[]): Map<string, string> {
  const candidatos: { t: string; i: string; p: number }[] = [];
  for (const t of tt) {
    const ft = fechaDe(t.timestamp).getTime();
    for (const i of ig) {
      const horas = Math.abs(fechaDe(i.timestamp).getTime() - ft) / 36e5;
      if (horas > 72) continue;
      const p = parecidoTexto(t.media_caption, i.media_caption) + (horas <= 3 ? 1 : 0);
      if (p >= 0.5) candidatos.push({ t: t.media_permalink, i: i.media_permalink, p });
    }
  }
  const out = new Map<string, string>();
  const usados = new Set<string>();
  for (const c of candidatos.sort((a, b) => b.p - a.p)) {
    if (out.has(c.t) || usados.has(c.i)) continue;
    out.set(c.t, c.i);
    usados.add(c.i);
  }
  return out;
}

// La ficha de cada vídeo de TikTok sale de la de su pareja en Instagram (GE, tema, gancho, prueba).
export function infoTikTok(pareja: Map<string, string>, info: InfoReel[]): InfoReel[] {
  const porUrl = new Map(info.map((i) => [i.permalink, i]));
  return [...pareja.entries()].flatMap(([t, i]) => {
    const x = porUrl.get(i);
    return x ? [{ ...x, permalink: t, duracion_s: null }] : [];
  });
}

export type Foto = { fecha: string; reels: ReelWindsor[] };

// Lo que el PC sabe de cada reel (registro.csv + estado del vídeo).
export type InfoReel = {
  permalink: string;
  ge: string | null;
  tema: string | null;
  gancho: string | null;
  duracion_s: number | null;
  elsa: boolean;
  tipo_gancho: string | null; // lo apunta el guionista: cifra+problema, pregunta, reto…
  prueba: string | null; // apuesta del analista que probaba (A01…) o «ninguna»
};

export type Senal = { tono: Tono; texto: string };

export type Reel = {
  permalink: string;
  publicado: string; // AAAA-MM-DD
  edad: number; // días desde que se publicó hasta la foto
  titulo: string;
  ge: string | null;
  tema: string | null;
  tipoGancho: string | null;
  prueba: string | null;
  portada: string | null;
  vistas: number;
  alcance: number;
  red: Red;
  salto: number | null; // % que se va en los 3 primeros segundos (solo Instagram)
  completo: number | null; // % que lo ve entero (solo TikTok)
  seguidores: number | null; // seguidores nuevos que trajo (solo TikTok)
  tiempoMedio: number | null; // segundos
  duracion: number | null; // segundos del montaje (Instagram: lo sabe el PC; TikTok: lo da TikTok)
  pctVisto: number | null; // tiempo medio ÷ duración del montaje (solo si sabemos la duración)
  guardados: number;
  compartidos: number;
  guardadosMil: number;
  compartidosMil: number;
  vistasSemana: number | null; // vistas ganadas desde la foto de hace ~7 días
  senales: Senal[];
};

export type Referencia = { vistas: number | null; salto: number | null; completo: number | null; tiempoMedio: number | null; socialMil: number | null };

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
export function construirReels(fotos: Foto[], info: InfoReel[], red: Red = "instagram"): { reels: Reel[]; foto: string | null; diasSemana: number | null } {
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
      const duracion = i?.duracion_s || r.duracion_s || null;
      const previo = antes.get(r.media_permalink);
      const reel: Reel = {
        permalink: r.media_permalink,
        publicado,
        edad: Math.max(0, dias(publicado, ultima.fecha)),
        titulo: tituloDe(r.media_caption, i?.gancho ?? null),
        ge: i?.ge ?? null,
        tema: i?.tema ?? null,
        tipoGancho: i?.tipo_gancho ?? null,
        prueba: i?.prueba && i.prueba !== "ninguna" ? i.prueba : null,
        portada: r.media_thumbnail_url ?? null,
        vistas,
        alcance: n(r.media_reach),
        red,
        salto: typeof r.media_reel_skip_rate === "number" ? r.media_reel_skip_rate * 100 : null,
        completo: typeof r.visto_entero === "number" ? r.visto_entero * 100 : null,
        seguidores: typeof r.seguidores_nuevos === "number" ? r.seguidores_nuevos : null,
        tiempoMedio,
        duracion,
        pctVisto: tiempoMedio !== null && duracion ? Math.min(100, (tiempoMedio / duracion) * 100) : null,
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
    completo: mediana(reels.map((r) => r.completo)),
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
  if (r.completo !== null && ref.completo) {
    if (r.completo >= ref.completo * 1.5) s.push({ tono: "bien", texto: `Lo ven entero el ${pct(r.completo)} (mucho más que la media)` });
    else if (r.completo <= ref.completo * 0.5) s.push({ tono: "ojo", texto: `Casi nadie llega al final (${pct(r.completo)})` });
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
  const nombre = NOMBRE_RED[reels[0]?.red ?? "instagram"];
  const maduros = reels.filter((r) => r.edad >= 7);

  // 1 · Ritmo de publicación (objetivo: 2 por semana)
  const ultimos30 = reels.filter((r) => dias(r.publicado, hoyISO) <= 30).length;
  const ultimo = reels[0];
  if (ultimo) {
    const hace = dias(ultimo.publicado, hoyISO);
    out.push({
      tono: ultimos30 >= 6 ? "bien" : ultimos30 >= 3 ? "ojo" : "mal",
      titulo: `${ultimos30} reels en 30 días (objetivo 8)`,
      texto: `El último salió hace ${hace === 0 ? "menos de un día" : `${hace} ${hace === 1 ? "día" : "días"}`}. ${nombre} reparte más a las cuentas que publican seguido: el ritmo pesa tanto como cada vídeo.`,
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

  // 2b · Solo TikTok: los que se ven enteros frente a las vistas, y la duración
  const conCompleto = maduros.filter((r) => r.completo !== null);
  const medC = mediana(conCompleto.map((r) => r.completo));
  if (conCompleto.length >= 4 && medC !== null) {
    const altos = conCompleto.filter((r) => (r.completo ?? 0) >= medC);
    const bajos = conCompleto.filter((r) => (r.completo ?? 0) < medC);
    const va = mediana(altos.map((r) => r.vistas));
    const vb2 = mediana(bajos.map((r) => r.vistas));
    if (altos.length >= 2 && bajos.length >= 2 && va && vb2) {
      const x = va / vb2;
      out.push({
        tono: x >= 1.3 ? "bien" : "neutro",
        titulo: x >= 1.3 ? `Los que se ven enteros: ${x.toFixed(1).replace(".", ",")} veces más vistas` : "Verlo entero no explica las vistas",
        texto: `Los que ve enteros más del ${pct(medC)} (${altos.length}) tienen ${miles(va)} vistas de mediana; el resto (${bajos.length}), ${miles(vb2)}.`,
        prueba: x >= 1.3 ? "Montajes que se acaban antes de que se cansen: quita lo que no aporta al final." : undefined,
      });
    }
  }
  const conDur = maduros.filter((r) => r.completo !== null && r.duracion !== null);
  const cortos = conDur.filter((r) => r.duracion! < 60);
  const largos = conDur.filter((r) => r.duracion! >= 60);
  if (cortos.length >= 2 && largos.length >= 2) {
    const cc = mediana(cortos.map((r) => r.completo))!;
    const cl = mediana(largos.map((r) => r.completo))!;
    out.push({
      tono: cc > cl * 1.5 ? "bien" : "neutro",
      titulo: cc > cl * 1.5 ? "Menos de 1 minuto: los ven enteros" : "La duración no marca la diferencia",
      texto: `De menos de 60 s (${cortos.length}) lo ve entero el ${pct(cc)} de mediana; de 60 s o más (${largos.length}), el ${pct(cl)}.`,
      prueba: cc > cl * 1.5 ? "Apunta a 30-50 s en TikTok." : undefined,
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
    completoReciente: mediana(recientes.map((r) => r.completo)),
    completoTotal: mediana(reels.map((r) => r.completo)),
    socialReciente: mediana(recientes.map((r) => r.guardadosMil + r.compartidosMil)),
    socialTotal: mediana(reels.map((r) => r.guardadosMil + r.compartidosMil)),
  };
}

export { miles };

// Apuestas del analista (trabajo/feedback/apuestas.md): lo que el guionista está probando y cómo se mide.
// Líneas «- A01 · qué probar · medida: … · desde AAAA-MM-DD · origen: …» bajo «## Abiertas» / «## Cerradas».
export type Apuesta = { id: string; texto: string; medida: string | null; desde: string | null; cerrada: boolean };

export function leerApuestas(md: string): Apuesta[] {
  const out: Apuesta[] = [];
  let seccion: "abiertas" | "cerradas" | null = null;
  for (const linea of md.split("\n")) {
    const t = linea.trim();
    if (t.startsWith("## ")) {
      const nombre = t.slice(3).toLowerCase();
      seccion = nombre.startsWith("abiertas") ? "abiertas" : nombre.startsWith("cerradas") ? "cerradas" : null;
      continue;
    }
    const m = seccion && t.match(/^-\s*(A\d+)\s*·\s*(.*)$/);
    if (!m) continue;
    const partes = m[2].split(/\s+·\s+/);
    const campo = (k: string) => partes.find((x) => x.toLowerCase().startsWith(`${k}`))?.replace(/^[^:\s]+:?\s*/, "") ?? null;
    out.push({
      id: m[1],
      texto: partes[0],
      medida: campo("medida"),
      desde: partes.find((x) => x.startsWith("desde"))?.replace(/^desde\s*/, "") ?? null,
      cerrada: seccion === "cerradas",
    });
  }
  return out;
}


// Instagram frente a TikTok con los mismos vídeos: dónde rinde más cada uno.
export type Pareja = { titulo: string; ge: string | null; publicado: string; ig: Reel; tt: Reel };

export function comparar(ig: Reel[], tt: Reel[], pareja: Map<string, string>) {
  const porIg = new Map(ig.map((r) => [r.permalink, r]));
  const parejas: Pareja[] = tt.flatMap((t) => {
    const i = porIg.get(pareja.get(t.permalink) ?? "");
    return i ? [{ titulo: i.titulo, ge: i.ge ?? t.ge, publicado: i.publicado, ig: i, tt: t }] : [];
  });
  const maduras = parejas.filter((p) => p.ig.edad >= 7 && p.tt.edad >= 7);
  const ratios = maduras.map((p) => (p.ig.vistas ? p.tt.vistas / p.ig.vistas : null));
  return {
    parejas,
    soloIg: ig.length - parejas.length,
    soloTt: tt.length - parejas.length,
    vistasIg: mediana(maduras.map((p) => p.ig.vistas)),
    vistasTt: mediana(maduras.map((p) => p.tt.vistas)),
    ratio: mediana(ratios), // vistas TikTok ÷ vistas Instagram del mismo vídeo
    ganaTt: maduras.filter((p) => p.tt.vistas > p.ig.vistas).length,
    maduras: maduras.length,
    seguidoresTt: tt.reduce((a, r) => a + (r.seguidores ?? 0), 0),
    socialIg: mediana(maduras.map((p) => p.ig.guardadosMil + p.ig.compartidosMil)),
    socialTt: mediana(maduras.map((p) => p.tt.guardadosMil + p.tt.compartidosMil)),
    tiempoIg: mediana(maduras.map((p) => p.ig.tiempoMedio)),
    tiempoTt: mediana(maduras.map((p) => p.tt.tiempoMedio)),
  };
}

// Lo que dice la comparación, en frases para decidir dónde poner el esfuerzo.
export function conclusionesComparar(c: ReturnType<typeof comparar>): Conclusion[] {
  const out: Conclusion[] = [];
  const x = (v: number) => v.toFixed(1).replace(".", ",");
  if (c.maduras >= 2 && c.ratio !== null && c.vistasIg !== null && c.vistasTt !== null) {
    const gana = c.ratio >= 1.2 ? "TikTok" : c.ratio <= 0.8 ? "Instagram" : null;
    out.push({
      tono: "info",
      titulo: gana ? `Con el mismo vídeo, ${gana} saca más vistas` : "Con el mismo vídeo, vistas parecidas",
      texto: `En ${c.maduras} vídeos subidos a las dos (con 7 días o más): ${miles(c.vistasIg)} vistas de mediana en Instagram y ${miles(c.vistasTt)} en TikTok. TikTok gana en ${c.ganaTt} de ${c.maduras}; de mediana saca ${x(c.ratio)} veces lo de Instagram.`,
    });
  }
  if (c.maduras >= 2 && c.socialIg !== null && c.socialTt !== null) {
    const mejor = c.socialIg >= c.socialTt ? "Instagram" : "TikTok";
    out.push({
      tono: "info",
      titulo: `Donde más se guarda y comparte: ${mejor}`,
      texto: `Guardados + compartidos por mil vistas: ${x(c.socialIg)} en Instagram y ${x(c.socialTt)} en TikTok (mediana).`,
    });
  }
  if (c.maduras >= 2 && c.tiempoIg !== null && c.tiempoTt !== null) {
    out.push({
      tono: "neutro",
      titulo: `Lo miran más rato en ${c.tiempoIg >= c.tiempoTt ? "Instagram" : "TikTok"}`,
      texto: `Tiempo medio de visionado: ${x(c.tiempoIg)} s en Instagram y ${x(c.tiempoTt)} s en TikTok.`,
    });
  }
  if (c.soloIg > 0 || c.soloTt > 0) {
    out.push({
      tono: "ojo",
      titulo: "No todo está en las dos",
      texto: [c.soloIg && `${c.soloIg} solo en Instagram`, c.soloTt && `${c.soloTt} solo en TikTok`].filter(Boolean).join(" · ") + ".",
      prueba: "Sube cada final aprobado a las dos redes: el montaje ya está hecho y cada una trae público distinto.",
    });
  }
  return out;
}
